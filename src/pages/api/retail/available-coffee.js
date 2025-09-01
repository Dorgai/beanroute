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
    // 1. Available in the shop's inventory (with actual stock > 0), OR
    // 2. Available in green stock (quantity > 0) AND the shop has access to order them
    let coffee;
    try {
      // First, get all coffees that are in the shop's inventory WITH ACTUAL STOCK
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

      console.log(`Shop inventory query returned ${shopInventoryCoffee.length} items with stock > 0`);
      shopInventoryCoffee.forEach(item => {
        console.log(`  - ${item.coffee.name}: Small=${item.smallBags}, Large=${item.largeBags}`);
      });

      // Then, get coffees with green stock that the shop can order
      // Only include coffees that are NOT already in the shop's inventory
      const shopInventoryCoffeeIds = shopInventoryCoffee.map(item => item.coffee.id);
      
      const greenStockCoffee = await prisma.greenCoffee.findMany({
        where: {
          quantity: {
            gt: 0
          },
          // Only include coffees that are NOT already in the shop's inventory
          id: {
            notIn: shopInventoryCoffeeIds
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

      console.log(`Green stock query returned ${greenStockCoffee.length} items with quantity > 0`);
      greenStockCoffee.forEach(coffee => {
        console.log(`  - ${coffee.name}: Quantity=${coffee.quantity}`);
      });

      // Debug: Check if there are any coffees in RetailInventory with zero stock for this shop
      const allShopCoffees = await prisma.retailInventory.findMany({
        where: {
          shopId: shopId
        },
        include: {
          coffee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      console.log(`Total coffees in shop ${shopId} inventory: ${allShopCoffees.length}`);
      allShopCoffees.forEach(item => {
        const totalStock = item.smallBags + item.largeBags;
        console.log(`  - ${item.coffee.name}: Small=${item.smallBags}, Large=${item.largeBags}, Total=${totalStock}`);
      });

      // Combine both lists
      const coffeeMap = new Map();

      // Add shop inventory coffees first (these are definitely available)
      shopInventoryCoffee.forEach(item => {
        console.log(`Adding shop inventory coffee: ${item.coffee.name} - Small: ${item.smallBags}, Large: ${item.largeBags}`);
        coffeeMap.set(item.coffee.id, {
          ...item.coffee,
          quantity: 0, // No green stock available for ordering
          source: 'shop_inventory',
          originalQuantity: 0,
          // Include shop inventory details
          shopSmallBags: item.smallBags,
          shopLargeBags: item.largeBags,
          shopTotalQuantity: item.totalQuantity
        });
      });

      // Add green stock coffees (if not already added)
      greenStockCoffee.forEach(coffee => {
        console.log(`Adding green stock coffee: ${coffee.name} - Quantity: ${coffee.quantity}`);
        coffeeMap.set(coffee.id, {
          ...coffee,
          source: 'green_stock',
          originalQuantity: coffee.quantity,
          // No shop inventory
          shopSmallBags: 0,
          shopLargeBags: 0,
          shopTotalQuantity: 0
        });
      });

      coffee = Array.from(coffeeMap.values());

      // Additional validation: filter out any coffees that somehow have zero stock in both places
      const filteredCoffee = coffee.filter(item => {
        if (item.source === 'shop_inventory') {
          const hasStock = (item.shopSmallBags > 0 || item.shopLargeBags > 0);
          if (!hasStock) {
            console.log(`Filtering out shop inventory coffee with zero stock: ${item.name}`);
          }
          return hasStock;
        } else if (item.source === 'green_stock') {
          const hasStock = item.originalQuantity > 0;
          if (!hasStock) {
            console.log(`Filtering out green stock coffee with zero stock: ${item.name}`);
          }
          return hasStock;
        }
        return false;
      });

      console.log(`Found ${coffee.length} total coffee items, filtered to ${filteredCoffee.length} with actual stock`);
      console.log(`Final coffee list:`, filteredCoffee.map(c => `${c.name} (${c.source})`));

      // Final safety check: ensure no coffees with zero stock slip through
      const finalFilteredCoffee = filteredCoffee.filter(item => {
        let hasStock = false;
        if (item.source === 'shop_inventory') {
          hasStock = (item.shopSmallBags > 0 || item.shopLargeBags > 0);
        } else if (item.source === 'green_stock') {
          hasStock = item.originalQuantity > 0;
        }
        
        if (!hasStock) {
          console.log(`FINAL FILTER: Removing coffee with zero stock: ${item.name} (${item.source})`);
          console.log(`  Shop stock: Small=${item.shopSmallBags}, Large=${item.shopLargeBags}`);
          console.log(`  Green stock: ${item.originalQuantity}`);
        }
        
        return hasStock;
      });

      console.log(`Final safety check: ${filteredCoffee.length} -> ${finalFilteredCoffee.length} coffees`);
      console.log(`Final coffee list after safety check:`, finalFilteredCoffee.map(c => `${c.name} (${c.source})`));

      coffee = finalFilteredCoffee;
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
      } else if (item.source === 'shop_inventory') {
        // For shop inventory coffees, use the shop's total quantity as available for ordering
        const shopTotalQuantity = (item.shopSmallBags * 0.2) + (item.shopLargeBags * 1.0);
        return {
          ...item,
          quantity: parseFloat(shopTotalQuantity.toFixed(2)), // Use shop inventory as available quantity
          haircutAmount: 0 // No haircut for shop inventory
        };
      } else {
        return {
          ...item,
          quantity: 0, // No stock available for ordering
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