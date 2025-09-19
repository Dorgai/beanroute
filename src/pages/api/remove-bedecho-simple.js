import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== REMOVING BEDECHO DUPLICATES (SIMPLE) ===');
    
    // Get the specific Tripoli order with Bedecho items - only basic fields
    const order = await prisma.retailOrder.findFirst({
      where: {
        status: 'PENDING',
        shop: {
          name: 'Anton' // This is the Tripoli shop based on the data
        }
      },
      select: {
        id: true,
        shop: {
          select: {
            name: true
          }
        },
        items: {
          where: {
            coffee: {
              name: 'Bedecho'
            }
          },
          select: {
            id: true,
            totalQuantity: true,
            smallBags: true,
            smallBagsEspresso: true,
            smallBagsFilter: true,
            largeBags: true,
            coffee: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`Found order ${order.id} (${order.shop?.name}) with ${order.items.length} Bedecho items`);
    
    if (order.items.length <= 1) {
      return res.status(200).json({ 
        success: true, 
        message: 'No duplicates found',
        totalItemsDeleted: 0 
      });
    }
    
    // Log all Bedecho items
    order.items.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ID=${item.id}, quantity=${item.totalQuantity}kg, smallBags=${item.smallBags}, espresso=${item.smallBagsEspresso}, filter=${item.smallBagsFilter}, large=${item.largeBags}`);
    });
    
    // Check if all items are identical
    const firstItem = order.items[0];
    const allIdentical = order.items.every(item => 
      item.totalQuantity === firstItem.totalQuantity &&
      item.smallBags === firstItem.smallBags &&
      item.smallBagsEspresso === firstItem.smallBagsEspresso &&
      item.smallBagsFilter === firstItem.smallBagsFilter &&
      item.largeBags === firstItem.largeBags
    );
    
    console.log(`All items identical: ${allIdentical}`);
    
    if (allIdentical) {
      console.log(`Removing ${order.items.length - 1} duplicate Bedecho items, keeping first one`);
      
      // Keep the first item, delete the rest
      const itemsToDelete = order.items.slice(1);
      let totalItemsDeleted = 0;
      
      for (const itemToDelete of itemsToDelete) {
        try {
          await prisma.retailOrderItem.delete({
            where: { id: itemToDelete.id }
          });
          console.log(`  Deleted item ${itemToDelete.id} (${itemToDelete.totalQuantity}kg)`);
          totalItemsDeleted++;
        } catch (error) {
          console.error(`  Failed to delete item ${itemToDelete.id}:`, error.message);
        }
      }
      
      console.log(`\n=== COMPLETED ===`);
      console.log(`Fixed ${totalItemsDeleted} duplicate Bedecho items`);
      
      res.status(200).json({ 
        success: true, 
        message: `Fixed ${totalItemsDeleted} duplicate Bedecho items`,
        totalItemsDeleted 
      });
    } else {
      console.log('Items are not identical - keeping all');
      res.status(200).json({ 
        success: true, 
        message: 'Items are not identical - no duplicates to remove',
        totalItemsDeleted: 0 
      });
    }
    
  } catch (error) {
    console.error('Error fixing Bedecho duplicates:', error);
    res.status(500).json({ error: 'Failed to fix Bedecho duplicates', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
