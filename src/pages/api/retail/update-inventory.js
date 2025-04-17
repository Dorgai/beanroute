// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Only allow POST requests for updating inventory
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Check if user has appropriate role to update inventory
    const userRole = session.user.role;
    const allowedRoles = ['ADMIN', 'OWNER', 'RETAILER', 'BARISTA'];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`User with role ${userRole} attempted to update inventory - access denied`);
      await prisma.$disconnect();
      return res.status(403).json({ error: 'You do not have permission to update inventory' });
    }

    // Get the inventory update data from request body
    const { inventoryId, smallBags, largeBags } = req.body;
    
    if (!inventoryId) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Missing required field: inventoryId' });
    }
    
    if (smallBags === undefined && largeBags === undefined) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'At least one of smallBags or largeBags must be provided' });
    }
    
    // Validate numeric values
    const smallBagsValue = smallBags !== undefined ? parseInt(smallBags, 10) : undefined;
    const largeBagsValue = largeBags !== undefined ? parseInt(largeBags, 10) : undefined;
    
    if ((smallBags !== undefined && (isNaN(smallBagsValue) || smallBagsValue < 0)) || 
        (largeBags !== undefined && (isNaN(largeBagsValue) || largeBagsValue < 0))) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Bag quantities must be non-negative numbers' });
    }
    
    // First, get the current inventory record to check shop access
    const currentInventory = await prisma.retailInventory.findUnique({
      where: {
        id: inventoryId
      },
      include: {
        shop: true
      }
    });
    
    if (!currentInventory) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    
    // If the user is not ADMIN or OWNER, check if they have access to this shop
    if (!['ADMIN', 'OWNER'].includes(userRole)) {
      const userShopAccess = await prisma.userShop.findFirst({
        where: {
          userId: session.user.id,
          shopId: currentInventory.shopId
        }
      });
      
      if (!userShopAccess) {
        console.log(`User ${session.user.id} attempted to update inventory for shop ${currentInventory.shopId} - access denied`);
        await prisma.$disconnect();
        return res.status(403).json({ error: 'You do not have permission to update inventory for this shop' });
      }
    }
    
    // Calculate the new total quantity
    const newSmallBags = smallBagsValue !== undefined ? smallBagsValue : currentInventory.smallBags;
    const newLargeBags = largeBagsValue !== undefined ? largeBagsValue : currentInventory.largeBags;
    const newTotalQuantity = (newSmallBags * 0.25) + (newLargeBags * 1.0);
    
    // Update the inventory record
    const updatedInventory = await prisma.retailInventory.update({
      where: {
        id: inventoryId
      },
      data: {
        smallBags: newSmallBags,
        largeBags: newLargeBags,
        totalQuantity: newTotalQuantity,
        updatedAt: new Date()
      }
    });
    
    // Log the activity for audit
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'RETAIL_INVENTORY',
        resourceId: inventoryId,
        details: JSON.stringify({
          shopId: currentInventory.shopId,
          previousValues: {
            smallBags: currentInventory.smallBags,
            largeBags: currentInventory.largeBags,
            totalQuantity: currentInventory.totalQuantity
          },
          newValues: {
            smallBags: newSmallBags,
            largeBags: newLargeBags,
            totalQuantity: newTotalQuantity
          }
        })
      }
    });
    
    await prisma.$disconnect();
    return res.status(200).json({
      success: true,
      inventory: updatedInventory
    });
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    await prisma.$disconnect();
    return res.status(500).json({ 
      error: 'Failed to update inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 