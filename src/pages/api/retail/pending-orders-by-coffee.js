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

    // Constants for bag sizes in kg (matching frontend)
    const SMALL_BAG_SIZE = 0.2; // 200g
    const LARGE_BAG_SIZE = 1.0; // 1kg
    
    // Group by coffee and sum small bags (espresso and filter separately)
    const coffeePendingTotals = {};
    
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        if (!item.coffee || !item.coffee.name) return;
        
        const coffeeId = item.coffeeId;
        const coffeeName = item.coffee.name;
        const coffeeGrade = item.coffee.grade?.replace('_', ' ') || 'Unknown';
        
        // Handle both old and new data structure for backward compatibility
        const smallBags = item.smallBags || 0;
        const espressoBags = item.smallBagsEspresso || 0;
        const filterBags = item.smallBagsFilter || 0;
        const largeBags = item.largeBags || 0;
        
        // For backward compatibility: if no espresso/filter data, treat smallBags as espresso
        let actualEspressoBags = espressoBags;
        let actualFilterBags = filterBags;
        let totalSmallBags = espressoBags + filterBags;
        
        if (smallBags > 0 && espressoBags === 0 && filterBags === 0) {
          // Old data structure - treat all smallBags as espresso for backward compatibility
          actualEspressoBags = smallBags;
          actualFilterBags = 0;
          totalSmallBags = smallBags;
        }
        
        if (!coffeePendingTotals[coffeeId]) {
          coffeePendingTotals[coffeeId] = {
            coffeeId,
            coffeeName,
            coffeeGrade,
            smallBags: 0,
            smallBagsEspresso: 0,
            smallBagsFilter: 0,
            largeBags: 0,
            totalKg: 0,
            espressoKg: 0,
            filterKg: 0,
            orderCount: 0
          };
        }
        
        // Add to the aggregated data (matching frontend logic exactly)
        coffeePendingTotals[coffeeId].smallBags += totalSmallBags;
        coffeePendingTotals[coffeeId].smallBagsEspresso += actualEspressoBags;
        coffeePendingTotals[coffeeId].smallBagsFilter += actualFilterBags;
        coffeePendingTotals[coffeeId].largeBags += largeBags;
        
        // Calculate total in kg (using the correct small bag size of 200g)
        const totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
        const espressoKg = actualEspressoBags * SMALL_BAG_SIZE;
        const filterKg = actualFilterBags * SMALL_BAG_SIZE;
        
        coffeePendingTotals[coffeeId].totalKg += totalKg;
        coffeePendingTotals[coffeeId].espressoKg += espressoKg;
        coffeePendingTotals[coffeeId].filterKg += filterKg;
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