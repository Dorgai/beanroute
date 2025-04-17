// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  if (req.method !== 'GET') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Check shop ID parameter
    const { shopId } = req.query;
    if (!shopId) {
      console.log('No shopId provided, returning empty result');
      await prisma.$disconnect();
      return res.status(200).json({});
    }

    console.log('Fetching inventory for shopId:', shopId);

    // Get retail inventory for the specified shop with error handling
    let inventory;
    try {
      // First check if the shop exists
      const shop = await prisma.shop.findUnique({
        where: { id: shopId }
      });
      
      if (!shop) {
        console.log(`Shop with ID ${shopId} not found`);
        await prisma.$disconnect();
        return res.status(404).json({ error: 'Shop not found' });
      }
      
      // Get all green coffee to ensure we have complete data
      const allCoffee = await prisma.greenCoffee.findMany();
      console.log(`Found ${allCoffee.length} coffee items in total`);
      
      // Now get the inventory records
      inventory = await prisma.retailInventory.findMany({
        where: {
          shopId
        },
        include: {
          coffee: true,
          shop: true
        },
        orderBy: [
          {
            coffee: {
              grade: 'asc'
            }
          },
          {
            coffee: {
              name: 'asc'
            }
          }
        ]
      });
      console.log(`Found ${inventory.length} inventory items for shop ${shopId}`);
      
      // Make sure all inventory items have a valid coffee reference
      inventory = inventory.filter(item => item && item.coffee);
      
    } catch (dbError) {
      console.error('Database error fetching inventory:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Database error fetching inventory',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    } finally {
      // Always disconnect to prevent connection pool issues
      await prisma.$disconnect();
    }

    if (!inventory || !Array.isArray(inventory)) {
      console.log('Invalid inventory data, returning empty result');
      return res.status(200).json({});
    }

    // Group inventory by coffee grade with defensive coding
    try {
      const groupedInventory = inventory.reduce((acc, item) => {
        if (!item || !item.coffee) {
          console.warn('Invalid inventory item found:', item);
          return acc;
        }
        
        const grade = item.coffee.grade || 'UNKNOWN';
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push(item);
        return acc;
      }, {});

      return res.status(200).json(groupedInventory);
    } catch (processError) {
      console.error('Error processing inventory data:', processError);
      // Return the raw inventory as a fallback
      return res.status(200).json({ 'UNKNOWN': inventory });
    }
  } catch (error) {
    console.error('Unhandled error in inventory API:', error);
    // Make sure to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch retail inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 