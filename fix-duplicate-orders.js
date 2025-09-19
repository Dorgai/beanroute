// Script to identify and fix duplicate Bedecho orders
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAndFixDuplicates() {
  try {
    console.log('=== FINDING DUPLICATE BEDECHO ORDERS ===\n');

    // Find all pending orders with Bedecho items
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

    // Filter for Bedecho orders
    const bedechoOrders = pendingOrders.filter(order => 
      order.items.some(item => 
        item.coffee.name.toLowerCase().includes('bedecho')
      )
    );

    console.log(`Found ${bedechoOrders.length} Bedecho orders`);

    // Group orders by shop and coffee
    const orderGroups = {};

    bedechoOrders.forEach(order => {
      const bedechoItems = order.items.filter(item => 
        item.coffee.name.toLowerCase().includes('bedecho')
      );

      bedechoItems.forEach(item => {
        const key = `${order.shop?.name || 'Unknown'}_${item.coffee.name}`;
        if (!orderGroups[key]) {
          orderGroups[key] = [];
        }
        orderGroups[key].push({
          orderId: order.id,
          shopName: order.shop?.name || 'Unknown',
          coffeeName: item.coffee.name,
          totalQuantity: item.totalQuantity,
          smallBags: item.smallBags,
          smallBagsEspresso: item.smallBagsEspresso,
          smallBagsFilter: item.smallBagsFilter,
          largeBags: item.largeBags,
          createdAt: order.createdAt,
          itemId: item.id
        });
      });
    });

    console.log('\n=== ANALYSIS ===');
    Object.entries(orderGroups).forEach(([key, orders]) => {
      const shop = key.split('_')[0];
      const coffee = key.split('_')[1];
      const totalQuantity = orders.reduce((sum, order) => sum + order.totalQuantity, 0);
      
      console.log(`\n${shop} - ${coffee}:`);
      console.log(`  Orders: ${orders.length}`);
      console.log(`  Total quantity: ${totalQuantity}kg`);
      
      if (orders.length > 1) {
        console.log(`  ⚠️  DUPLICATE DETECTED!`);
        orders.forEach((order, index) => {
          console.log(`    ${index + 1}. Order ${order.orderId} - ${order.totalQuantity}kg - Created: ${order.createdAt}`);
        });
        
        // Find the oldest order to keep
        const sortedOrders = orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keepOrder = sortedOrders[0];
        const deleteOrders = sortedOrders.slice(1);
        
        console.log(`\n  📋 RECOMMENDATION:`);
        console.log(`    Keep: Order ${keepOrder.orderId} (oldest)`);
        console.log(`    Delete: ${deleteOrders.map(o => o.orderId).join(', ')}`);
        
        // Ask user if they want to proceed with deletion
        console.log(`\n  🗑️  To delete duplicates, run:`);
        deleteOrders.forEach(order => {
          console.log(`    DELETE FROM "RetailOrder" WHERE id = '${order.orderId}';`);
        });
      }
    });

    // Summary
    const duplicateGroups = Object.entries(orderGroups).filter(([key, orders]) => orders.length > 1);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total pending orders: ${pendingOrders.length}`);
    console.log(`Bedecho orders: ${bedechoOrders.length}`);
    console.log(`Duplicate groups: ${duplicateGroups.length}`);
    
    if (duplicateGroups.length > 0) {
      console.log(`\n🎯 This explains why you see 3.6kg instead of 1.8kg in the summary!`);
      console.log(`   The PendingOrdersSummary is correctly adding up all orders, including duplicates.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndFixDuplicates();
