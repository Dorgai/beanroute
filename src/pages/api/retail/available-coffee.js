// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();

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

    // We are now allowing roaster users to view coffee availability
    // Roasters need access to see what coffee is available for orders

    console.log('Fetching available coffee');

    // Get shop ID from query parameters
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get coffees that are either:
    // 1. Available in green stock (quantity > 0), OR
    // 2. Available in the shop's inventory (even if no green stock)
    let coffee;
    try {
      // First, get all coffees with green stock
      const greenStockCoffee = await prisma.greenCoffee.findMany({
        where: {
          quantity: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          grade: true,
          quantity: true,
          isEspresso: true,
          isFilter: true,
          isSignature: true
        }
      });

      // Then, get all coffees that are in the shop's inventory
      const shopInventoryCoffee = await prisma.retailInventory.findMany({
        where: {
          shopId: shopId,
          OR: [
            { smallBags: { gt: 0 } },
            { largeBags: { gt: 0 } }
          ]
        },
        include: {
          coffee: {
            select: {
              id: true,
              name: true,
              grade: true,
              isEspresso: true,
              isFilter: true,
              isSignature: true
            }
          }
        }
      });

      // Combine both lists, removing duplicates
      const coffeeMap = new Map();

      // Add green stock coffees
      greenStockCoffee.forEach(coffee => {
        coffeeMap.set(coffee.id, {
          ...coffee,
          source: 'green_stock',
          originalQuantity: coffee.quantity
        });
      });

      // Add shop inventory coffees (if not already added)
      shopInventoryCoffee.forEach(item => {
        if (!coffeeMap.has(item.coffee.id)) {
          coffeeMap.set(item.coffee.id, {
            ...item.coffee,
            quantity: 0, // No green stock
            source: 'shop_inventory',
            originalQuantity: 0
          });
        }
      });

      coffee = Array.from(coffeeMap.values());

      console.log(`Found ${coffee.length} available coffee items (${greenStockCoffee.length} with green stock, ${shopInventoryCoffee.length} in shop inventory)`);
    } catch (dbError) {
      console.error('Database error fetching available coffee:', dbError);
      return res.status(500).json({ 
        error: 'Database error fetching available coffee',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    } finally {
      // Always disconnect to prevent connection pool issues
      await prisma.$disconnect();
    }

    if (!coffee || !Array.isArray(coffee)) {
      console.log('Invalid coffee data, returning empty result');
      return res.status(200).json([]);
    }

    // Apply 15% haircut to available quantities for ordering (only for green stock coffees)
    const coffeeWithHaircut = coffee.map(item => {
      if (item.source === 'green_stock' && item.originalQuantity > 0) {
        return {
          ...item,
          quantity: parseFloat((item.originalQuantity * 0.85).toFixed(2)), // Apply 15% haircut (85% of original)
          haircutAmount: parseFloat((item.originalQuantity * 0.15).toFixed(2)) // Calculate haircut amount
        };
      } else {
        return {
          ...item,
          quantity: 0, // No green stock available for ordering
          haircutAmount: 0
        };
      }
    });

    console.log(`Applied 15% haircut to ${coffeeWithHaircut.filter(c => c.source === 'green_stock').length} green stock coffee items`);

    return res.status(200).json(coffeeWithHaircut);
  } catch (error) {
    console.error('Unhandled error in available coffee API:', error);
    // Make sure to disconnect prisma in case of errors too
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch available coffee',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 