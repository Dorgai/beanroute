import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Skip authentication for debugging
  try {
    console.log('=== CHECKING FOR DUPLICATE BEDECHO ORDERS ===\n');

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

    const result = {
      totalPendingOrders: pendingOrders.length,
      bedechoOrders: bedechoOrders.length,
      orders: []
    };

    bedechoOrders.forEach((order, index) => {
      const bedechoItems = order.items.filter(item => 
        item.coffee.name.toLowerCase().includes('bedecho')
      );

      bedechoItems.forEach(item => {
        result.orders.push({
          orderId: order.id,
          shopName: order.shop?.name || 'Unknown',
          coffeeName: item.coffee.name,
          totalQuantity: item.totalQuantity,
          smallBags: item.smallBags,
          smallBagsEspresso: item.smallBagsEspresso,
          smallBagsFilter: item.smallBagsFilter,
          largeBags: item.largeBags,
          createdAt: order.createdAt
        });
      });
    });

    // Check for duplicates
    const duplicates = [];
    const orderGroups = {};

    result.orders.forEach(order => {
      const key = `${order.shopName}_${order.coffeeName}`;
      if (!orderGroups[key]) {
        orderGroups[key] = [];
      }
      orderGroups[key].push(order);
    });

    Object.entries(orderGroups).forEach(([key, orders]) => {
      if (orders.length > 1) {
        // Check if all orders have identical quantities
        const firstOrder = orders[0];
        const allIdentical = orders.every(order => 
          order.totalQuantity === firstOrder.totalQuantity &&
          order.smallBags === firstOrder.smallBags &&
          order.smallBagsEspresso === firstOrder.smallBagsEspresso &&
          order.smallBagsFilter === firstOrder.smallBagsFilter &&
          order.largeBags === firstOrder.largeBags
        );
        
        if (allIdentical) {
          duplicates.push({
            key,
            orders: orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          });
        }
      }
    });

    result.duplicates = duplicates;
    result.summary = Object.entries(orderGroups).map(([key, orders]) => ({
      shop: key.split('_')[0],
      coffee: key.split('_')[1],
      count: orders.length,
      totalQuantity: orders.reduce((sum, order) => sum + order.totalQuantity, 0)
    }));

    console.log('\n=== SUMMARY ===');
    console.log(`Total pending orders: ${result.totalPendingOrders}`);
    console.log(`Bedecho orders: ${result.bedechoOrders}`);
    console.log(`Duplicate groups: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\nDUPLICATES FOUND:');
      duplicates.forEach((dup, index) => {
        console.log(`\nDuplicate Group ${index + 1}: ${dup.key}`);
        console.log(`  Total orders: ${dup.orders.length}`);
        console.log(`  Quantity per order: ${dup.orders[0].totalQuantity}kg`);
        console.log(`  Total quantity: ${dup.orders.reduce((sum, order) => sum + order.totalQuantity, 0)}kg`);
        console.log(`  Orders:`);
        dup.orders.forEach((order, orderIndex) => {
          console.log(`    ${orderIndex + 1}. ${order.orderId} - Created: ${order.createdAt}`);
        });
      });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
