const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test order for status update testing...');
    
    // Find a shop to create an order for
    const shop = await prisma.shop.findFirst({
      where: { name: 'Bean Heaven' },
    });
    
    if (!shop) {
      console.log('No shop found with name "Bean Heaven", trying to find any shop...');
      const anyShop = await prisma.shop.findFirst();
      
      if (!anyShop) {
        console.log('No shops found in the database. Creating a test shop...');
        const newShop = await prisma.shop.create({
          data: {
            name: 'Test Shop',
            address: '123 Test Street',
            minCoffeeQuantitySmall: 20,
            minCoffeeQuantityLarge: 10,
            createdById: admin.id
          }
        });
        console.log(`Created test shop: ${newShop.name} (${newShop.id})`);
        shop = newShop;
      } else {
        shop = anyShop;
        console.log(`Using existing shop: ${shop.name} (${shop.id})`);
      }
    } else {
      console.log(`Found Bean Heaven shop: ${shop.name} (${shop.id})`);
    }
    
    // Find available coffee types
    let coffee = await prisma.greenCoffee.findFirst({
      where: { name: 'Ethiopian Yirgacheffe' }
    });
    
    if (!coffee) {
      console.log('No Ethiopian Yirgacheffe coffee found, looking for any coffee...');
      coffee = await prisma.greenCoffee.findFirst();
    }
    
    if (!coffee) {
      console.log('No coffee found in the database. Creating test coffee...');
      
      // Find a user to associate with the coffee creation
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (!admin) {
        console.log('No admin user found. Please ensure an admin user exists.');
        return;
      }
      
      coffee = await prisma.greenCoffee.create({
        data: {
          name: 'Test Coffee',
          grade: 'SPECIALTY', // Using enum value from schema
          country: 'Test Origin',
          quantity: 100,
          createdById: admin.id
        }
      });
      console.log(`Created test coffee: ${coffee.name} (${coffee.id})`);
    } else {
      console.log(`Using existing coffee: ${coffee.name} (${coffee.id})`);
    }
    
    // Find a user to associate with the order
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      console.log('No admin user found. Please ensure an admin user exists.');
      return;
    }
    
    console.log(`Using admin user: ${admin.username} (${admin.id}) for order`);
    
    // Create a new order
    const order = await prisma.retailOrder.create({
      data: {
        shopId: shop.id,
        status: 'PENDING',
        orderedById: admin.id,
        items: {
          create: [
            {
              coffeeId: coffee.id,
              smallBags: 5,
              largeBags: 2,
              totalQuantity: 5 * 0.2 + 2 * 1.0,  // Calculate based on bag weights
            }
          ]
        }
      },
      include: {
        shop: true,
        items: {
          include: {
            coffee: true
          }
        }
      }
    });
    
    console.log(`Created test order: ${order.id}`);
    console.log('Order details:', {
      shop: order.shop.name,
      status: order.status,
      items: order.items.map(item => ({
        coffee: item.coffee.name,
        smallBags: item.smallBags,
        largeBags: item.largeBags,
        totalQuantity: item.totalQuantity
      }))
    });
    
    console.log('\nTo test updating this order status, run:');
    console.log(`curl -X PUT http://localhost:3000/api/retail/update-order-status \\
  -H "Content-Type: application/json" \\
  -d '{"orderId":"${order.id}", "status":"CONFIRMED"}' \\
  -c cookies.txt`);
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 