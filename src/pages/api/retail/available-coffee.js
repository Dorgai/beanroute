// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { getHaircutPercentage } from '@/lib/haircut-service';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  console.log('🚀 [available-coffee] API called - VERSION 0.1.1 with 500g bag support - AGGRESSIVE REBUILD v4');

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
    let greenStockCoffee; // Move to outer scope
    try {
      // First, get all coffees that are in the shop's inventory WITH ACTUAL STOCK
      const shopInventoryCoffee = await prisma.retailInventory.findMany({
        where: {
          shopId: shopId,
          OR: [
            { smallBagsEspresso: { gt: 0 } },
            { smallBagsFilter: { gt: 0 } },
            { mediumBagsEspresso: { gt: 0 } },
            { mediumBagsFilter: { gt: 0 } },
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
        console.log(`  - ${item.coffee.name}: Small Espresso=${item.smallBagsEspresso}, Small Filter=${item.smallBagsFilter}, Medium Espresso=${item.mediumBagsEspresso || 0}, Medium Filter=${item.mediumBagsFilter || 0}, Large=${item.largeBags}`);
      });

      // Then, get coffees with green stock that the shop can order
      // Include ALL coffees with green stock, regardless of shop inventory
      greenStockCoffee = await prisma.greenCoffee.findMany({
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
        const totalStock = (item.smallBagsEspresso || 0) + (item.smallBagsFilter || 0) + (item.mediumBagsEspresso || 0) + (item.mediumBagsFilter || 0) + (item.largeBags || 0);
        console.log(`  - ${item.coffee.name}: Small Espresso=${item.smallBagsEspresso || 0}, Small Filter=${item.smallBagsFilter || 0}, Medium Espresso=${item.mediumBagsEspresso || 0}, Medium Filter=${item.mediumBagsFilter || 0}, Large=${item.largeBags || 0}, Total=${totalStock}`);
      });

      // Combine both lists - prioritize green stock for ordering
      const coffeeMap = new Map();

      // Add green stock coffees first (these are available for ordering)
      greenStockCoffee.forEach(coffee => {
        console.log(`Adding green stock coffee: ${coffee.name} - Quantity: ${coffee.quantity}`);
        coffeeMap.set(coffee.id, {
          ...coffee,
          source: 'green_stock',
          originalQuantity: coffee.quantity,
          // No shop inventory initially
          shopSmallBagsEspresso: 0,
          shopSmallBagsFilter: 0,
          shopMediumBagsEspresso: 0,
          shopMediumBagsFilter: 0,
          shopLargeBags: 0,
          shopTotalQuantity: 0
        });
      });

      // Add shop inventory coffees (these show current shop stock)
      shopInventoryCoffee.forEach(item => {
        console.log(`Adding shop inventory coffee: ${item.coffee.name} - Small Espresso: ${item.smallBagsEspresso}, Small Filter: ${item.smallBagsFilter}, Medium Espresso: ${item.mediumBagsEspresso || 0}, Medium Filter: ${item.mediumBagsFilter || 0}, Large: ${item.largeBags}`);
        
        // If this coffee is already in the map (has green stock), update it with shop inventory
        if (coffeeMap.has(item.coffee.id)) {
          const existingCoffee = coffeeMap.get(item.coffee.id);
          coffeeMap.set(item.coffee.id, {
            ...existingCoffee,
            source: 'both', // Has both green stock and shop inventory
            shopSmallBagsEspresso: item.smallBagsEspresso,
            shopSmallBagsFilter: item.smallBagsFilter,
            shopMediumBagsEspresso: item.mediumBagsEspresso || 0,
            shopMediumBagsFilter: item.mediumBagsFilter || 0,
            shopLargeBags: item.largeBags,
            shopTotalQuantity: item.totalQuantity
          });
        } else {
          // Only shop inventory, no green stock
          coffeeMap.set(item.coffee.id, {
            ...item.coffee,
            quantity: 0, // No green stock available for ordering
            source: 'shop_inventory',
            originalQuantity: 0,
            // Include shop inventory details
            shopSmallBagsEspresso: item.smallBagsEspresso,
            shopSmallBagsFilter: item.smallBagsFilter,
            shopMediumBagsEspresso: item.mediumBagsEspresso || 0,
            shopMediumBagsFilter: item.mediumBagsFilter || 0,
            shopLargeBags: item.largeBags,
            shopTotalQuantity: item.totalQuantity
          });
        }
      });

      coffee = Array.from(coffeeMap.values());

      // Additional validation: filter out any coffees that somehow have zero stock in both places
      const filteredCoffee = coffee.filter(item => {
        if (item.source === 'shop_inventory') {
          const hasStock = (item.shopSmallBagsEspresso > 0 || item.shopSmallBagsFilter > 0 || item.shopMediumBagsEspresso > 0 || item.shopMediumBagsFilter > 0 || item.largeBags > 0);
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
        } else if (item.source === 'both') {
          // Has both green stock and shop inventory - always include for ordering
          const hasGreenStock = item.originalQuantity > 0;
          if (!hasGreenStock) {
            console.log(`Filtering out both source coffee with zero green stock: ${item.name}`);
          }
          return hasGreenStock;
        }
        return false;
      });

      console.log(`Found ${coffee.length} total coffee items, filtered to ${filteredCoffee.length} with actual stock`);
      console.log(`Final coffee list:`, filteredCoffee.map(c => `${c.name} (${c.source})`));

      // Final safety check: ensure no coffees with zero stock slip through
      const finalFilteredCoffee = filteredCoffee.filter(item => {
        let hasStock = false;
        if (item.source === 'shop_inventory') {
          hasStock = (item.shopSmallBagsEspresso > 0 || item.shopSmallBagsFilter > 0 || item.shopMediumBagsEspresso > 0 || item.shopMediumBagsFilter > 0 || item.largeBags > 0);
        } else if (item.source === 'green_stock') {
          hasStock = item.originalQuantity > 0;
        } else if (item.source === 'both') {
          hasStock = item.originalQuantity > 0; // For ordering, green stock is what matters
        }
        
        if (!hasStock) {
          console.log(`FINAL FILTER: Removing coffee with zero stock: ${item.name} (${item.source})`);
          console.log(`  Shop stock: Small Espresso=${item.shopSmallBagsEspresso}, Small Filter=${item.shopSmallBagsFilter}, Medium Espresso=${item.shopMediumBagsEspresso}, Medium Filter=${item.shopMediumBagsFilter}, Large=${item.largeBags}`);
          console.log(`  Green stock: ${item.originalQuantity}`);
        }
        
        return hasStock;
      });

      console.log(`Final safety check: ${filteredCoffee.length} -> ${finalFilteredCoffee.length} coffees`);
      console.log(`Final coffee list after safety check:`, finalFilteredCoffee.map(c => `${c.name} (${c.source})`));

      coffee = finalFilteredCoffee;
    } catch (dbError) {
      console.error('Database error fetching available coffee:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Database error fetching available coffee',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!coffee || !Array.isArray(coffee)) {
      console.log('Invalid coffee data, returning empty result');
      return res.status(200).json([]);
    }

    // Apply dynamic haircut to available quantities for ordering (only for green stock coffees)
    const haircutPercentage = await getHaircutPercentage(prisma);
    console.log(`[available-coffee] Using haircut percentage: ${haircutPercentage}%`);
    
    const coffeeWithHaircut = coffee.map(item => {
      if (item.source === 'green_stock' && item.originalQuantity > 0) {
        // For green stock coffees, show the quantity AFTER haircut (this is what's actually available for ordering)
        const haircutAmount = parseFloat((item.originalQuantity * (haircutPercentage / 100)).toFixed(2));
        const quantityAfterHaircut = parseFloat((item.originalQuantity * (1 - haircutPercentage / 100)).toFixed(2));
        
        console.log(`[available-coffee] ${item.name}: Green stock ${item.originalQuantity}kg, haircut ${haircutAmount}kg (${haircutPercentage}%), available for ordering: ${quantityAfterHaircut}kg`);
        
        return {
          ...item,
          quantity: quantityAfterHaircut, // Show quantity AFTER haircut (what's actually available for ordering)
          haircutAmount: haircutAmount,
          haircutPercentage: haircutPercentage,
          originalQuantity: item.originalQuantity, // Keep original for reference
          note: `Green stock: ${item.originalQuantity}kg. After ${haircutPercentage}% haircut: ${quantityAfterHaircut}kg available for ordering.`
        };
      } else if (item.source === 'both' && item.originalQuantity > 0) {
        // This coffee has both shop inventory AND green stock - show green stock for ordering
        const haircutAmount = parseFloat((item.originalQuantity * (haircutPercentage / 100)).toFixed(2));
        const quantityAfterHaircut = parseFloat((item.originalQuantity * (1 - haircutPercentage / 100)).toFixed(2));
        const shopTotalQuantity = (item.shopSmallBagsEspresso * 0.2) + (item.shopSmallBagsFilter * 0.2) + (item.shopMediumBagsEspresso * 0.5) + (item.shopMediumBagsFilter * 0.5) + (item.shopLargeBags * 1.0);
        
        console.log(`[available-coffee] ${item.name}: Both sources - Shop inventory: ${shopTotalQuantity.toFixed(2)}kg, Green stock: ${item.originalQuantity}kg, available for ordering: ${quantityAfterHaircut}kg`);
        
        return {
          ...item,
          quantity: quantityAfterHaircut, // Available for ordering from green stock
          originalQuantity: item.originalQuantity, // Green stock quantity
          haircutAmount: haircutAmount,
          haircutPercentage: haircutPercentage,
          shopInventoryQuantity: parseFloat(shopTotalQuantity.toFixed(2)), // Shop inventory quantity
          note: `Shop inventory: ${parseFloat(shopTotalQuantity.toFixed(2))}kg. Green stock: ${item.originalQuantity}kg. After ${haircutPercentage}% haircut: ${quantityAfterHaircut}kg available for ordering.`
        };
      } else if (item.source === 'shop_inventory') {
        // For shop inventory coffees, check if they also have green stock available for ordering
        const shopTotalQuantity = (item.shopSmallBagsEspresso * 0.2) + (item.shopSmallBagsFilter * 0.2) + (item.shopMediumBagsEspresso * 0.5) + (item.shopMediumBagsFilter * 0.5) + (item.shopLargeBags * 1.0);
        console.log(`[available-coffee] ${item.name}: Shop inventory - Small Espresso: ${item.shopSmallBagsEspresso}×0.2kg, Small Filter: ${item.shopSmallBagsFilter}×0.2kg, Medium Espresso: ${item.shopMediumBagsEspresso}×0.5kg, Medium Filter: ${item.shopMediumBagsFilter}×0.5kg, Large: ${item.shopLargeBags}×1.0kg = ${shopTotalQuantity.toFixed(2)}kg in shop inventory`);
        
        // Check if this coffee also has green stock available for ordering
        const greenStockItem = greenStockCoffee.find(coffee => coffee.id === item.id);
        if (greenStockItem && greenStockItem.quantity > 0) {
          // This coffee has both shop inventory AND green stock - show green stock for ordering
          const haircutAmount = parseFloat((greenStockItem.quantity * (haircutPercentage / 100)).toFixed(2));
          const quantityAfterHaircut = parseFloat((greenStockItem.quantity * (1 - haircutPercentage / 100)).toFixed(2));
          
          console.log(`[available-coffee] ${item.name}: Also has green stock ${greenStockItem.quantity}kg, available for ordering: ${quantityAfterHaircut}kg`);
          
          return {
            ...item,
            quantity: quantityAfterHaircut, // Available for ordering from green stock
            originalQuantity: greenStockItem.quantity, // Green stock quantity
            haircutAmount: haircutAmount,
            haircutPercentage: haircutPercentage,
            shopInventoryQuantity: parseFloat(shopTotalQuantity.toFixed(2)), // Shop inventory quantity
            note: `Shop inventory: ${parseFloat(shopTotalQuantity.toFixed(2))}kg. Green stock: ${greenStockItem.quantity}kg. After ${haircutPercentage}% haircut: ${quantityAfterHaircut}kg available for ordering.`
          };
        } else {
          // Only shop inventory, no green stock available for ordering
          return {
            ...item,
            quantity: 0, // NOT available for ordering (no green stock)
            shopInventoryQuantity: parseFloat(shopTotalQuantity.toFixed(2)), // Shop inventory quantity
            haircutAmount: 0, // No haircut for shop inventory
            haircutPercentage: 0,
            note: `Shop inventory: ${parseFloat(shopTotalQuantity.toFixed(2))}kg (no green stock available for ordering).`
          };
        }
      } else {
        return {
          ...item,
          quantity: 0, // No stock available for ordering
          haircutAmount: 0,
          haircutPercentage: 0,
          note: 'No stock available.'
        };
      }
    });

    console.log(`Applied ${haircutPercentage}% haircut to ${coffeeWithHaircut.filter(c => c.source === 'green_stock').length} green stock coffee items`);

    // Disconnect Prisma at the end
    await prisma.$disconnect();
    
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