const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkDuplicateOrders() {
  try {
    console.log('=== CHECKING FOR DUPLICATE ORDERS ===\n');

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

    // Check for Bedecho orders specifically
    const bedechoOrders = pendingOrders.filter(order => 
      order.items.some(item => 
        item.coffee.name.toLowerCase().includes('bedecho')
      )
    );

    console.log(`\nFound ${bedechoOrders.length} Bedecho orders:`);
    
    bedechoOrders.forEach((order, index) => {
      console.log(`\nBedecho Order ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Shop: ${order.shop?.name || 'Unknown'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Created: ${order.createdAt}`);
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

    // Check for exact duplicates (same shop, same coffee, same quantities)
    console.log('\n=== CHECKING FOR EXACT DUPLICATES ===');
    const duplicates = [];
    
    for (let i = 0; i < bedechoOrders.length; i++) {
      for (let j = i + 1; j < bedechoOrders.length; j++) {
        const order1 = bedechoOrders[i];
        const order2 = bedechoOrders[j];
        
        // Check if same shop
        if (order1.shopId === order2.shopId) {
          // Check if same coffee quantities
          const item1 = order1.items.find(item => item.coffee.name.toLowerCase().includes('bedecho'));
          const item2 = order2.items.find(item => item.coffee.name.toLowerCase().includes('bedecho'));
          
          if (item1 && item2) {
            const isDuplicate = 
              item1.smallBags === item2.smallBags &&
              item1.smallBagsEspresso === item2.smallBagsEspresso &&
              item1.smallBagsFilter === item2.smallBagsFilter &&
              item1.largeBags === item2.largeBags &&
              item1.totalQuantity === item2.totalQuantity;
            
            if (isDuplicate) {
              duplicates.push({
                order1: { id: order1.id, shop: order1.shop?.name, createdAt: order1.createdAt },
                order2: { id: order2.id, shop: order2.shop?.name, createdAt: order2.createdAt },
                item: {
                  smallBags: item1.smallBags,
                  smallBagsEspresso: item1.smallBagsEspresso,
                  smallBagsFilter: item1.smallBagsFilter,
                  largeBags: item1.largeBags,
                  totalQuantity: item1.totalQuantity
                }
              });
            }
          }
        }
      }
    }

    if (duplicates.length > 0) {
      console.log(`\nFound ${duplicates.length} duplicate order pairs:`);
      duplicates.forEach((dup, index) => {
        console.log(`\nDuplicate ${index + 1}:`);
        console.log(`  Order 1: ${dup.order1.id} (${dup.order1.shop}) - ${dup.order1.createdAt}`);
        console.log(`  Order 2: ${dup.order2.id} (${dup.order2.shop}) - ${dup.order2.createdAt}`);
        console.log(`  Quantities: ${dup.item.totalQuantity}kg (${dup.item.smallBags} small, ${dup.item.largeBags} large)`);
      });
    } else {
      console.log('\nNo exact duplicates found.');
    }

    // Calculate total quantities by shop
    console.log('\n=== TOTAL QUANTITIES BY SHOP ===');
    const quantitiesByShop = {};
    
    bedechoOrders.forEach(order => {
      const shopName = order.shop?.name || 'Unknown';
      if (!quantitiesByShop[shopName]) {
        quantitiesByShop[shopName] = {
          orders: [],
          totalQuantity: 0,
          totalSmallBags: 0,
          totalLargeBags: 0
        };
      }

      order.items.forEach(item => {
        if (item.coffee.name.toLowerCase().includes('bedecho')) {
          quantitiesByShop[shopName].orders.push({
            orderId: order.id,
            totalQuantity: item.totalQuantity,
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags
          });
          
          quantitiesByShop[shopName].totalQuantity += item.totalQuantity;
          quantitiesByShop[shopName].totalSmallBags += (item.smallBagsEspresso + item.smallBagsFilter);
          quantitiesByShop[shopName].totalLargeBags += item.largeBags;
        }
      });
    });

    Object.entries(quantitiesByShop).forEach(([shopName, data]) => {
      console.log(`\n${shopName}:`);
      console.log(`  Total Quantity: ${data.totalQuantity}kg`);
      console.log(`  Total Small Bags: ${data.totalSmallBags}`);
      console.log(`  Total Large Bags: ${data.totalLargeBags}`);
      console.log(`  Orders: ${data.orders.length}`);
      data.orders.forEach((order, index) => {
        console.log(`    Order ${index + 1} (${order.orderId}): ${order.totalQuantity}kg`);
      });
    });

  } catch (error) {
    console.error('Error checking duplicate orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateOrders();
