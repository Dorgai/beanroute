const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function debugBedechoOrders() {
  try {
    console.log('=== DEBUGGING BEDECHO ORDERS ===\n');

    // 1. Find all pending orders
    console.log('1. All Pending Orders:');
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

    console.log(`Found ${pendingOrders.length} pending orders:`);
    pendingOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Shop: ${order.shop?.name || 'Unknown'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Items:`);
      order.items.forEach((item, itemIndex) => {
        console.log(`    Item ${itemIndex + 1}:`);
        console.log(`      Coffee: ${item.coffee.name}`);
        console.log(`      Small Bags: ${item.smallBags}`);
        console.log(`      Small Bags Espresso: ${item.smallBagsEspresso}`);
        console.log(`      Small Bags Filter: ${item.smallBagsFilter}`);
        console.log(`      Large Bags: ${item.largeBags}`);
        console.log(`      Total Quantity: ${item.totalQuantity}`);
        console.log(`      Green Coffee Consumed: ${item.greenCoffeeConsumed}`);
      });
    });

    // 2. Find specifically Bedecho orders
    console.log('\n\n2. Bedecho Orders Only:');
    const bedechoOrders = pendingOrders.filter(order => 
      order.items.some(item => 
        item.coffee.name.toLowerCase().includes('bedecho')
      )
    );

    console.log(`Found ${bedechoOrders.length} Bedecho orders:`);
    bedechoOrders.forEach((order, index) => {
      console.log(`\nBedecho Order ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Shop: ${order.shop?.name || 'Unknown'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Items:`);
      order.items.forEach((item, itemIndex) => {
        if (item.coffee.name.toLowerCase().includes('bedecho')) {
          console.log(`    Bedecho Item ${itemIndex + 1}:`);
          console.log(`      Coffee: ${item.coffee.name}`);
          console.log(`      Small Bags: ${item.smallBags}`);
          console.log(`      Small Bags Espresso: ${item.smallBagsEspresso}`);
          console.log(`      Small Bags Filter: ${item.smallBagsFilter}`);
          console.log(`      Large Bags: ${item.largeBags}`);
          console.log(`      Total Quantity: ${item.totalQuantity}`);
          console.log(`      Green Coffee Consumed: ${item.greenCoffeeConsumed}`);
        }
      });
    });

    // 3. Calculate total Bedecho quantities by shop
    console.log('\n\n3. Bedecho Quantities by Shop:');
    const bedechoByShop = {};
    
    bedechoOrders.forEach(order => {
      const shopName = order.shop?.name || 'Unknown';
      if (!bedechoByShop[shopName]) {
        bedechoByShop[shopName] = {
          orders: [],
          totalQuantity: 0,
          totalSmallBags: 0,
          totalLargeBags: 0
        };
      }

      order.items.forEach(item => {
        if (item.coffee.name.toLowerCase().includes('bedecho')) {
          bedechoByShop[shopName].orders.push({
            orderId: order.id,
            totalQuantity: item.totalQuantity,
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags
          });
          
          bedechoByShop[shopName].totalQuantity += item.totalQuantity;
          bedechoByShop[shopName].totalSmallBags += (item.smallBagsEspresso + item.smallBagsFilter);
          bedechoByShop[shopName].totalLargeBags += item.largeBags;
        }
      });
    });

    Object.entries(bedechoByShop).forEach(([shopName, data]) => {
      console.log(`\n${shopName}:`);
      console.log(`  Total Quantity: ${data.totalQuantity}kg`);
      console.log(`  Total Small Bags: ${data.totalSmallBags}`);
      console.log(`  Total Large Bags: ${data.totalLargeBags}`);
      console.log(`  Orders: ${data.orders.length}`);
      data.orders.forEach((order, index) => {
        console.log(`    Order ${index + 1} (${order.orderId}): ${order.totalQuantity}kg`);
      });
    });

    // 4. Check if there are any duplicate orders or items
    console.log('\n\n4. Checking for Duplicates:');
    const allOrderIds = pendingOrders.map(order => order.id);
    const uniqueOrderIds = [...new Set(allOrderIds)];
    console.log(`Total orders: ${allOrderIds.length}, Unique orders: ${uniqueOrderIds.length}`);
    
    if (allOrderIds.length !== uniqueOrderIds.length) {
      console.log('WARNING: Duplicate orders found!');
    }

    // 5. Check the pending-orders-by-coffee API logic
    console.log('\n\n5. Simulating pending-orders-by-coffee API logic:');
    const coffeeAggregation = {};
    
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        const coffeeName = item.coffee.name;
        if (!coffeeAggregation[coffeeName]) {
          coffeeAggregation[coffeeName] = {
            name: coffeeName,
            totalQuantity: 0,
            totalSmallBags: 0,
            totalLargeBags: 0,
            shopBreakdown: {}
          };
        }

        // Calculate quantities using the same logic as the API
        const espressoBags = item.smallBagsEspresso || 0;
        const filterBags = item.smallBagsFilter || 0;
        const smallBags = item.smallBags || 0;
        const largeBags = item.largeBags || 0;

        let actualEspressoBags, actualFilterBags, totalSmallBags;

        if (espressoBags > 0 || filterBags > 0) {
          // New data structure
          actualEspressoBags = espressoBags;
          actualFilterBags = filterBags;
          totalSmallBags = espressoBags + filterBags;
        } else if (smallBags > 0) {
          // Old data structure
          actualEspressoBags = smallBags;
          actualFilterBags = 0;
          totalSmallBags = smallBags;
        } else {
          actualEspressoBags = 0;
          actualFilterBags = 0;
          totalSmallBags = 0;
        }

        const totalQuantity = (totalSmallBags * 0.25) + (largeBags * 1.0);

        coffeeAggregation[coffeeName].totalQuantity += totalQuantity;
        coffeeAggregation[coffeeName].totalSmallBags += totalSmallBags;
        coffeeAggregation[coffeeName].totalLargeBags += largeBags;

        // Shop breakdown
        const shopName = order.shop?.name || 'Unknown';
        if (!coffeeAggregation[coffeeName].shopBreakdown[shopName]) {
          coffeeAggregation[coffeeName].shopBreakdown[shopName] = {
            totalKg: 0,
            smallBags: 0,
            largeBags: 0
          };
        }
        coffeeAggregation[coffeeName].shopBreakdown[shopName].totalKg += totalQuantity;
        coffeeAggregation[coffeeName].shopBreakdown[shopName].smallBags += totalSmallBags;
        coffeeAggregation[coffeeName].shopBreakdown[shopName].largeBags += largeBags;
      });
    });

    // Show Bedecho specifically
    const bedechoData = coffeeAggregation['Bedecho'];
    if (bedechoData) {
      console.log('\nBedecho Aggregation:');
      console.log(`  Total Quantity: ${bedechoData.totalQuantity}kg`);
      console.log(`  Total Small Bags: ${bedechoData.totalSmallBags}`);
      console.log(`  Total Large Bags: ${bedechoData.totalLargeBags}`);
      console.log(`  Shop Breakdown:`);
      Object.entries(bedechoData.shopBreakdown).forEach(([shopName, breakdown]) => {
        console.log(`    ${shopName}: ${breakdown.totalKg}kg (${breakdown.smallBags} small, ${breakdown.largeBags} large)`);
      });
    }

  } catch (error) {
    console.error('Error debugging Bedecho orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBedechoOrders();
