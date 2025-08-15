import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    // Get user session
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Fetch all pending orders with their items
    const pendingOrders = await prisma.retailOrder.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            coffee: {
              select: {
                id: true,
                name: true,
                grade: true
              }
            }
          }
        }
      }
    });

    // Group by coffee and sum small bags (espresso and filter separately)
    const coffeePendingTotals = {};
    
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        const coffeeId = item.coffeeId;
        const coffeeName = item.coffee?.name || 'Unknown';
        const coffeeGrade = item.coffee?.grade || 'UNKNOWN';
        
        // Handle both old and new data structure
        const smallBags = item.smallBags || 0;
        const espressoBags = item.smallBagsEspresso || 0;
        const filterBags = item.smallBagsFilter || 0;
        
        // For backward compatibility: if no espresso/filter data, use smallBags as espresso
        const totalEspressoBags = espressoBags || (smallBags && !filterBags ? smallBags : 0);
        const totalFilterBags = filterBags || 0;
        
        if (!coffeePendingTotals[coffeeId]) {
          coffeePendingTotals[coffeeId] = {
            coffeeId,
            coffeeName,
            coffeeGrade,
            totalSmallBags: 0,
            totalEspressoBags: 0,
            totalFilterBags: 0,
            orderCount: 0
          };
        }
        
        coffeePendingTotals[coffeeId].totalSmallBags += smallBags;
        coffeePendingTotals[coffeeId].totalEspressoBags += totalEspressoBags;
        coffeePendingTotals[coffeeId].totalFilterBags += totalFilterBags;
        coffeePendingTotals[coffeeId].orderCount += 1;
      });
    });

    // Convert to array and sort by coffee name
    const result = Object.values(coffeePendingTotals).sort((a, b) => 
      a.coffeeName.localeCompare(b.coffeeName)
    );

    console.log(`Found ${result.length} coffees with pending orders`);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching pending orders by coffee:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch pending orders data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
} 