import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    const debugInfo = {
      totalPendingOrders: pendingOrders.length,
      orders: [],
      bedechoOrders: [],
      bedechoByShop: {},
      coffeeAggregation: {}
    };

    pendingOrders.forEach((order, index) => {
      const orderInfo = {
        id: order.id,
        shop: order.shop?.name || 'Unknown',
        status: order.status,
        items: []
      };

      order.items.forEach((item, itemIndex) => {
        const itemInfo = {
          coffee: item.coffee.name,
          smallBags: item.smallBags,
          smallBagsEspresso: item.smallBagsEspresso,
          smallBagsFilter: item.smallBagsFilter,
          largeBags: item.largeBags,
          totalQuantity: item.totalQuantity,
          greenCoffeeConsumed: item.greenCoffeeConsumed
        };
        orderInfo.items.push(itemInfo);
      });

      debugInfo.orders.push(orderInfo);
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
      const bedechoOrderInfo = {
        id: order.id,
        shop: order.shop?.name || 'Unknown',
        status: order.status,
        items: []
      };

      order.items.forEach((item, itemIndex) => {
        if (item.coffee.name.toLowerCase().includes('bedecho')) {
          const itemInfo = {
            coffee: item.coffee.name,
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags,
            totalQuantity: item.totalQuantity,
            greenCoffeeConsumed: item.greenCoffeeConsumed
          };
          bedechoOrderInfo.items.push(itemInfo);
        }
      });

      debugInfo.bedechoOrders.push(bedechoOrderInfo);
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
          const orderItem = {
            orderId: order.id,
            totalQuantity: item.totalQuantity,
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags
          };
          
          bedechoByShop[shopName].orders.push(orderItem);
          bedechoByShop[shopName].totalQuantity += item.totalQuantity;
          bedechoByShop[shopName].totalSmallBags += (item.smallBagsEspresso + item.smallBagsFilter);
          bedechoByShop[shopName].totalLargeBags += item.largeBags;
        }
      });
    });

    debugInfo.bedechoByShop = bedechoByShop;

    // 4. Check if there are any duplicate orders or items
    console.log('\n\n4. Checking for Duplicates:');
    const allOrderIds = pendingOrders.map(order => order.id);
    const uniqueOrderIds = [...new Set(allOrderIds)];
    console.log(`Total orders: ${allOrderIds.length}, Unique orders: ${uniqueOrderIds.length}`);
    
    debugInfo.duplicateCheck = {
      totalOrders: allOrderIds.length,
      uniqueOrders: uniqueOrderIds.length,
      hasDuplicates: allOrderIds.length !== uniqueOrderIds.length
    };

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

    debugInfo.coffeeAggregation = coffeeAggregation;

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

    res.status(200).json(debugInfo);

  } catch (error) {
    console.error('Error debugging Bedecho orders:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
