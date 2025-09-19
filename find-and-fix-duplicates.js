// Script to find and fix duplicate orders

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function findAndFixDuplicates() {
  try {
    console.log('=== FINDING DUPLICATE ORDERS ===\n');

    // Find all pending orders
    const pendingOrders = await prisma.retailOrder.findMany({
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

    console.log(`Found ${pendingOrders.length} pending orders`);

    // Group orders by shop and coffee to find duplicates
    const orderGroups = {};
    
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        const coffeeName = item.coffee.name;
        const shopName = order.shop?.name || 'Unknown';
        const key = `${shopName}_${coffeeName}`;
        
        if (!orderGroups[key]) {
          orderGroups[key] = [];
        }
        
        orderGroups[key].push({
          orderId: order.id,
          shopName: shopName,
          coffeeName: coffeeName,
          createdAt: order.createdAt,
          item: {
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags,
            totalQuantity: item.totalQuantity
          }
        });
      });
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(orderGroups).forEach(([key, orders]) => {
      if (orders.length > 1) {
        // Check if all orders have identical quantities
        const firstOrder = orders[0];
        const allIdentical = orders.every(order => 
          order.item.smallBags === firstOrder.item.smallBags &&
          order.item.smallBagsEspresso === firstOrder.item.smallBagsEspresso &&
          order.item.smallBagsFilter === firstOrder.item.smallBagsFilter &&
          order.item.largeBags === firstOrder.item.largeBags &&
          order.item.totalQuantity === firstOrder.item.totalQuantity
        );
        
        if (allIdentical) {
          duplicates.push({
            key,
            orders: orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort by creation date
          });
        }
      }
    });

    if (duplicates.length > 0) {
      console.log(`\nFound ${duplicates.length} duplicate order groups:`);
      
      duplicates.forEach((dup, index) => {
        console.log(`\nDuplicate Group ${index + 1}: ${dup.key}`);
        console.log(`  Total orders: ${dup.orders.length}`);
        console.log(`  Quantities: ${dup.orders[0].item.totalQuantity}kg (${dup.orders[0].item.smallBags} small, ${dup.orders[0].item.largeBags} large)`);
        console.log(`  Orders:`);
        
        dup.orders.forEach((order, orderIndex) => {
          console.log(`    ${orderIndex + 1}. Order ${order.orderId} - Created: ${order.createdAt}`);
        });
        
        // Keep the oldest order, delete the rest
        const ordersToDelete = dup.orders.slice(1); // Keep first (oldest), delete the rest
        
        console.log(`\n  Recommended action: Keep order ${dup.orders[0].orderId} (oldest), delete ${ordersToDelete.length} duplicate(s)`);
        console.log(`  Orders to delete: ${ordersToDelete.map(o => o.orderId).join(', ')}`);
      });

      // Ask for confirmation before deleting
      console.log('\n=== DUPLICATE REMOVAL ===');
      console.log('To remove duplicates, uncomment the deletion code below and run again.');
      console.log('WARNING: This will permanently delete duplicate orders!');
      
      // Uncomment the following lines to actually delete duplicates:
      /*
      for (const dup of duplicates) {
        const ordersToDelete = dup.orders.slice(1);
        for (const orderToDelete of ordersToDelete) {
          console.log(`Deleting duplicate order: ${orderToDelete.orderId}`);
          await prisma.retailOrder.delete({
            where: { id: orderToDelete.orderId }
          });
        }
      }
      console.log('Duplicate orders deleted successfully!');
      */
      
    } else {
      console.log('\nNo duplicate orders found.');
    }

    // Show summary by shop
    console.log('\n=== SUMMARY BY SHOP ===');
    Object.entries(orderGroups).forEach(([key, orders]) => {
      const [shopName, coffeeName] = key.split('_');
      const totalQuantity = orders.reduce((sum, order) => sum + order.item.totalQuantity, 0);
      console.log(`${shopName} - ${coffeeName}: ${orders.length} orders, ${totalQuantity}kg total`);
    });

  } catch (error) {
    console.error('Error finding duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndFixDuplicates();
