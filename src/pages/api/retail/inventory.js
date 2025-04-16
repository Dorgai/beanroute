import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Check shop ID parameter
    const { shopId } = req.query;
    if (!shopId) {
      console.log('No shopId provided, returning empty result');
      return res.status(200).json({});
    }

    console.log('Fetching inventory for shopId:', shopId);

    // Get retail inventory for the specified shop with error handling
    let inventory;
    try {
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
    } catch (dbError) {
      console.error('Database error fetching inventory:', dbError);
      return res.status(500).json({ 
        error: 'Database error fetching inventory',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
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
    return res.status(500).json({ 
      error: 'Failed to fetch retail inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 