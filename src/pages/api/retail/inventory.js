// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  console.log(`[api/retail/inventory] Request received: ${req.method} ${req.url}`);
  console.log(`[api/retail/inventory] Query parameters:`, req.query);
  
  if (req.method !== 'GET') {
    console.log(`[api/retail/inventory] Method ${req.method} not allowed`);
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      console.log('[api/retail/inventory] No session found');
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log(`[api/retail/inventory] User authenticated: ${session.user.role}`);

    // Get shopId from query parameters
    const { shopId } = req.query;
    if (!shopId) {
      console.log('[api/retail/inventory] No shopId provided');
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    console.log(`[api/retail/inventory] Fetching inventory for shop ${shopId}`);

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[api/retail/inventory] Database connection verified');
    } catch (dbTestError) {
      console.error('[api/retail/inventory] Database connection test failed:', dbTestError);
      await prisma.$disconnect();
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // First, get all available green coffee in the system
    let allCoffee = [];
    try {
      allCoffee = await prisma.greenCoffee.findMany({
        where: {
          quantity: { gt: 0 } // Only get coffees with actual stock
        },
        select: {
          id: true,
          name: true,
          grade: true,
          country: true,
          producer: true,
          process: true,
          notes: true,
          quantity: true,
          isEspresso: true,
          isFilter: true,
          isSignature: true,
          price: true
        },
        orderBy: [
          { grade: 'asc' },
          { name: 'asc' }
        ]
      });
      console.log(`[api/retail/inventory] Found ${allCoffee.length} active green coffee types with stock > 0`);
    } catch (coffeeError) {
      console.error('[api/retail/inventory] Error fetching green coffee:', coffeeError);
      await prisma.$disconnect();
      return res.status(500).json({ error: 'Failed to fetch green coffee data' });
    }

    // Then, get the shop's current inventory for these coffees
    let shopInventory = [];
    try {
      shopInventory = await prisma.retailInventory.findMany({
        where: {
          shopId,
          coffeeId: {
            in: allCoffee.map(coffee => coffee.id)
          }
        },
        select: {
          id: true,
          shopId: true,
          coffeeId: true,
          smallBags: true,
          smallBagsEspresso: true,
          smallBagsFilter: true,
          largeBags: true,
          totalQuantity: true,
          lastOrderDate: true,
          createdAt: true,
          updatedAt: true
        }
      });
      console.log(`[api/retail/inventory] Found ${shopInventory.length} inventory records for shop ${shopId}`);
    } catch (inventoryError) {
      console.error('[api/retail/inventory] Error fetching shop inventory:', inventoryError);
      // Continue with empty inventory - we'll show all coffee with zero quantities
      shopInventory = [];
    }

    // Create a map of shop inventory for quick lookup
    const inventoryMap = new Map();
    shopInventory.forEach(item => {
      inventoryMap.set(item.coffeeId, item);
    });

    // Combine all coffee with shop inventory data
    // Show ALL available green coffee, with zero quantities for items not in shop inventory
    const combinedInventory = allCoffee.map(coffee => {
      const shopItem = inventoryMap.get(coffee.id);
      
      if (shopItem) {
        // Shop has this coffee in inventory
        return {
          id: shopItem.id,
          shopId: shopItem.shopId,
          coffeeId: coffee.id,
          smallBags: shopItem.smallBags || 0,
          smallBagsEspresso: shopItem.smallBagsEspresso || 0,
          smallBagsFilter: shopItem.smallBagsFilter || 0,
          largeBags: shopItem.largeBags || 0,
          totalQuantity: shopItem.totalQuantity || 0,
          lastOrderDate: shopItem.lastOrderDate,
          createdAt: shopItem.createdAt,
          updatedAt: shopItem.updatedAt,
          source: 'shop_inventory',
          greenStockAvailable: coffee.quantity || 0,
          canOrder: coffee.quantity > 0,
          coffee: {
            id: coffee.id,
            name: coffee.name,
            grade: coffee.grade,
            country: coffee.country,
            producer: coffee.producer,
            process: coffee.process,
            notes: coffee.notes,
            quantity: coffee.quantity,
            isEspresso: coffee.isEspresso,
            isFilter: coffee.isFilter,
            isSignature: coffee.isSignature,
            price: coffee.price
          }
        };
      } else {
        // Shop doesn't have this coffee in inventory - show with zero quantities but indicate green stock availability
        const hasGreenStock = coffee.quantity > 0;
        return {
          id: null, // No inventory record exists yet
          shopId: shopId,
          coffeeId: coffee.id,
          smallBags: 0,
          smallBagsEspresso: 0,
          smallBagsFilter: 0,
          largeBags: 0,
          totalQuantity: 0,
          lastOrderDate: null,
          createdAt: null,
          updatedAt: null,
          source: 'green_stock_only',
          greenStockAvailable: coffee.quantity || 0,
          canOrder: hasGreenStock,
          note: hasGreenStock ? 
            `Available for ordering from green stock (${coffee.quantity}kg available)` : 
            'Not currently available for ordering',
          coffee: {
            id: coffee.id,
            name: coffee.name,
            grade: coffee.grade,
            country: coffee.country,
            producer: coffee.producer,
            process: coffee.process,
            notes: coffee.notes,
            quantity: coffee.quantity,
            isEspresso: coffee.isEspresso,
            isFilter: coffee.isFilter,
            isSignature: coffee.isSignature,
            price: coffee.price
          }
        };
      }
    });

    // Sort by grade and name
    combinedInventory.sort((a, b) => {
      if (a.coffee.grade !== b.coffee.grade) {
        return a.coffee.grade.localeCompare(b.coffee.grade);
      }
      return a.coffee.name.localeCompare(b.coffee.name);
    });

    // Calculate summary statistics
    const summary = {
      totalCoffees: combinedInventory.length,
      shopInventory: combinedInventory.filter(item => item.source === 'shop_inventory').length,
      greenStockOnly: combinedInventory.filter(item => item.source === 'green_stock_only').length,
      availableForOrder: combinedInventory.filter(item => item.canOrder).length,
      totalGreenStock: combinedInventory.reduce((sum, item) => sum + (item.greenStockAvailable || 0), 0)
    };

    console.log(`[api/retail/inventory] Returning ${combinedInventory.length} coffee items for shop ${shopId}`);
    console.log(`[api/retail/inventory] Summary: ${summary.shopInventory} in shop inventory, ${summary.greenStockOnly} available from green stock, ${summary.availableForOrder} total available for ordering`);
    
    await prisma.$disconnect();
    return res.status(200).json({
      summary,
      inventory: combinedInventory
    });

  } catch (error) {
    console.error('[api/retail/inventory] Unexpected error:', error);
    await prisma.$disconnect();
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 