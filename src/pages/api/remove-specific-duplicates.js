import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== REMOVING SPECIFIC DUPLICATES ===');
    
    // Target the specific order ID we know has duplicates
    const orderId = 'e8469c69-4ff4-41ee-9e90-e9465c50ceb7';
    
    // Get all Bedecho items for this specific order
    const bedechoItems = await prisma.retailOrderItem.findMany({
      where: {
        orderId: orderId,
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
    });
    
    console.log(`Found ${bedechoItems.length} Bedecho items for order ${orderId}`);
    
    if (bedechoItems.length <= 1) {
      return res.status(200).json({ 
        success: true, 
        message: 'No duplicates found',
        totalItemsDeleted: 0 
      });
    }
    
    // Log all Bedecho items
    bedechoItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ID=${item.id}, quantity=${item.totalQuantity}kg, smallBags=${item.smallBags}, espresso=${item.smallBagsEspresso}, filter=${item.smallBagsFilter}, large=${item.largeBags}`);
    });
    
    // Check if all items are identical
    const firstItem = bedechoItems[0];
    const allIdentical = bedechoItems.every(item => 
      item.totalQuantity === firstItem.totalQuantity &&
      item.smallBags === firstItem.smallBags &&
      item.smallBagsEspresso === firstItem.smallBagsEspresso &&
      item.smallBagsFilter === firstItem.smallBagsFilter &&
      item.largeBags === firstItem.largeBags
    );
    
    console.log(`All items identical: ${allIdentical}`);
    
    if (allIdentical) {
      console.log(`Removing ${bedechoItems.length - 1} duplicate Bedecho items, keeping first one`);
      
      // Keep the first item, delete the rest
      const itemsToDelete = bedechoItems.slice(1);
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
    console.error('Error fixing specific duplicates:', error);
    res.status(500).json({ error: 'Failed to fix specific duplicates', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
