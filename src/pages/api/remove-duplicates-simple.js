import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== SIMPLE DUPLICATE REMOVAL ===');
    
    // Get all pending orders with their items
    const orders = await prisma.retailOrder.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            coffee: true
          }
        },
        shop: true
      }
    });
    
    console.log(`Found ${orders.length} pending orders`);
    
    let totalItemsDeleted = 0;
    
    for (const order of orders) {
      console.log(`\nProcessing order ${order.id} (${order.shop?.name || 'Unknown'})`);
      
      // Group items by coffee type within each order
      const itemGroups = {};
      order.items.forEach(item => {
        const key = item.coffee.name;
        if (!itemGroups[key]) {
          itemGroups[key] = [];
        }
        itemGroups[key].push(item);
      });
      
      // Find duplicate items within the same order
      for (const [coffeeName, items] of Object.entries(itemGroups)) {
        if (items.length > 1) {
          console.log(`  Found ${items.length} items for ${coffeeName}`);
          
          // Check if all items are identical
          const firstItem = items[0];
          const allIdentical = items.every(item => 
            item.totalQuantity === firstItem.totalQuantity &&
            item.smallBags === firstItem.smallBags &&
            item.smallBagsEspresso === firstItem.smallBagsEspresso &&
            item.smallBagsFilter === firstItem.smallBagsFilter &&
            item.largeBags === firstItem.largeBags
          );
          
          if (allIdentical) {
            console.log(`    All items are identical - keeping first, deleting ${items.length - 1} duplicates`);
            
            // Keep the first item, delete the rest
            const itemsToDelete = items.slice(1);
            
            for (const itemToDelete of itemsToDelete) {
              try {
                await prisma.retailOrderItem.delete({
                  where: { id: itemToDelete.id }
                });
                console.log(`    Deleted item ${itemToDelete.id} (${coffeeName}, ${itemToDelete.totalQuantity}kg)`);
                totalItemsDeleted++;
              } catch (error) {
                console.error(`    Failed to delete item ${itemToDelete.id}:`, error.message);
              }
            }
          } else {
            console.log(`    Items are not identical - keeping all`);
          }
        }
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Fixed ${totalItemsDeleted} duplicate items`);
    
    res.status(200).json({ 
      success: true, 
      message: `Fixed ${totalItemsDeleted} duplicate items`,
      totalItemsDeleted 
    });
    
  } catch (error) {
    console.error('Error fixing duplicates:', error);
    res.status(500).json({ error: 'Failed to fix duplicates', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
