// API endpoint to retrieve inventory history for a specific shop
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Only allow GET requests for retrieving inventory history
  if (req.method !== 'GET') {
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

    // Check shop ID parameter
    const { shopId } = req.query;
    if (!shopId) {
      console.log('No shopId provided, returning empty result');
      await prisma.$disconnect();
      return res.status(200).json([]);
    }

    console.log('Fetching inventory history for shopId:', shopId);

    // Calculate the date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get inventory history for the specified shop
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
      
      // Find all UserActivity records related to RETAIL_INVENTORY for this shop
      const inventoryActivities = await prisma.userActivity.findMany({
        where: {
          action: 'UPDATE',
          resource: 'RETAIL_INVENTORY',
          createdAt: {
            gte: threeMonthsAgo
          },
          details: {
            contains: `"shopId":"${shopId}"`  // This is a simplistic approach, might need refinement
          }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Process the activities to extract meaningful data
      const processedActivities = await Promise.all(inventoryActivities.map(async activity => {
        let details;
        try {
          details = JSON.parse(activity.details);
        } catch (e) {
          console.error('Error parsing activity details:', e);
          details = { error: 'Could not parse activity details' };
        }

        // Get the inventory item details
        const inventoryItem = await prisma.retailInventory.findUnique({
          where: {
            id: activity.resourceId
          },
          include: {
            coffee: true
          }
        });

        return {
          id: activity.id,
          timestamp: activity.createdAt,
          inventoryId: activity.resourceId,
          user: {
            id: activity.user.id,
            name: activity.user.firstName && activity.user.lastName 
              ? `${activity.user.firstName} ${activity.user.lastName}`
              : activity.user.username,
            role: activity.user.role
          },
          coffee: inventoryItem?.coffee ? {
            id: inventoryItem.coffee.id,
            name: inventoryItem.coffee.name,
            grade: inventoryItem.coffee.grade
          } : null,
          changes: {
            previousValues: details.previousValues || {},
            newValues: details.newValues || {},
            quantityChange: details.newValues && details.previousValues
              ? details.newValues.totalQuantity - details.previousValues.totalQuantity
              : 0
          }
        };
      }));

      await prisma.$disconnect();
      return res.status(200).json(processedActivities);
      
    } catch (dbError) {
      console.error('Database error fetching inventory history:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Database error fetching inventory history',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('Unhandled error in inventory history API:', error);
    // Make sure to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch inventory history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 