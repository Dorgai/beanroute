// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  console.log('[update-inventory] Handling request method:', req.method);
  
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
      console.log('[update-inventory] Session user role:', session.user.role);
    } catch (sessionError) {
      console.error('[update-inventory] Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Check if user has appropriate role to update inventory
    const userRole = session.user.role;
    const allowedRoles = ['ADMIN', 'OWNER', 'RETAILER', 'BARISTA'];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`[update-inventory] User with role ${userRole} attempted to update inventory - access denied`);
      await prisma.$disconnect();
      return res.status(403).json({ error: 'You do not have permission to update inventory' });
    }

    // Get the inventory update data from request body
    const { inventoryId, smallBags, largeBags } = req.body;
    console.log('[update-inventory] Update request for:', { inventoryId, smallBags, largeBags });
    
    if (!inventoryId) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Missing required field: inventoryId' });
    }
    
    if (smallBags === undefined && largeBags === undefined) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'At least one of smallBags or largeBags must be provided' });
    }
    
    // Validate numeric values
    const smallBagsValue = smallBags !== undefined ? parseFloat(smallBags) : undefined;
    const largeBagsValue = largeBags !== undefined ? parseFloat(largeBags) : undefined;
    
    if ((smallBags !== undefined && (isNaN(smallBagsValue) || smallBagsValue < 0)) || 
        (largeBags !== undefined && (isNaN(largeBagsValue) || largeBagsValue < 0))) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Bag quantities must be non-negative numbers' });
    }
    
    // First, get the current inventory record to check shop access
    try {
      console.log('[update-inventory] Fetching inventory record:', inventoryId);
      const currentInventory = await prisma.retailInventory.findUnique({
        where: {
          id: inventoryId
        },
        select: {
          id: true,
          shopId: true,
          coffeeId: true,
          smallBags: true,
          largeBags: true,
          totalQuantity: true
        }
      });
      
      if (!currentInventory) {
        console.log('[update-inventory] Inventory record not found:', inventoryId);
        await prisma.$disconnect();
        return res.status(404).json({ error: 'Inventory record not found' });
      }
      
      // If the user is not ADMIN or OWNER, check if they have access to this shop
      if (!['ADMIN', 'OWNER'].includes(userRole)) {
        console.log('[update-inventory] Checking user shop access for non-admin user');
        const userShopAccess = await prisma.userShop.findFirst({
          where: {
            userId: session.user.id,
            shopId: currentInventory.shopId
          }
        });
        
        if (!userShopAccess) {
          console.log(`[update-inventory] User ${session.user.id} attempted to update inventory for shop ${currentInventory.shopId} - access denied`);
          await prisma.$disconnect();
          return res.status(403).json({ error: 'You do not have permission to update inventory for this shop' });
        }
      }
      
      // Calculate the new total quantity
      const newSmallBags = smallBagsValue !== undefined ? smallBagsValue : currentInventory.smallBags;
      const newLargeBags = largeBagsValue !== undefined ? largeBagsValue : currentInventory.largeBags;
      
      // Calculate new total quantity in kg
      const newTotalQuantity = (newSmallBags * 0.2) + (newLargeBags * 1.0);
      
      console.log('[update-inventory] Updating inventory with new values:', {
        smallBags: newSmallBags,
        largeBags: newLargeBags,
        totalQuantity: newTotalQuantity
      });
      
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
      try {
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
      } catch (activityError) {
        console.error('Failed to log user activity:', activityError);
        // Continue without failing the main operation
      }
      
      console.log('[update-inventory] Successfully updated inventory:', inventoryId);
      await prisma.$disconnect();
      return res.status(200).json({
        success: true,
        inventory: updatedInventory
      });
    } catch (dbError) {
      console.error('[update-inventory] Database error:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Database error during inventory update',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('[update-inventory] Error updating inventory:', error);
    await prisma.$disconnect();
    return res.status(500).json({ 
      error: 'Failed to update inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 