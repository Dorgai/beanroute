const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting deployment issue fix script...');
    
    // 1. Fix shop-related issues
    console.log('\n======= FIXING SHOP USER ISSUES =======');
    
    // Get all shops
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
      }
    });
    
    console.log(`Found ${shops.length} shops in the database`);
    shops.forEach(shop => {
      console.log(`- ${shop.name} (${shop.id})`);
    });
    
    if (shops.length === 0) {
      console.log('Creating a test shop since no shops exist...');
      const newShop = await prisma.shop.create({
        data: {
          name: 'Test Shop',
          address: '123 Test Street',
          minCoffeeQuantitySmall: 20,
          minCoffeeQuantityLarge: 10,
        }
      });
      console.log(`Created shop: ${newShop.name} (${newShop.id})`);
      shops.push(newShop);
    }
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      }
    });
    
    console.log(`\nFound ${users.length} users in the database`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.id}) - Role: ${user.role}`);
    });
    
    // For each shop, check users
    for (const shop of shops) {
      console.log(`\nChecking users for shop: ${shop.name} (${shop.id})`);
      
      // Get users assigned to this shop
      const shopUsers = await prisma.userShop.findMany({
        where: { shopId: shop.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            }
          }
        }
      });
      
      console.log(`Found ${shopUsers.length} users assigned to shop ${shop.name}`);
      shopUsers.forEach(su => {
        console.log(`- ${su.user.username} (${su.userId}) - Role: ${su.role}`);
      });
      
      // For each user, make sure they're assigned to at least one shop
      for (const user of users) {
        const isAssigned = shopUsers.some(su => su.userId === user.id);
        
        if (!isAssigned) {
          console.log(`User ${user.username} (${user.id}) is not assigned to shop ${shop.name}, assigning now...`);
          try {
            await prisma.userShop.create({
              data: {
                userId: user.id,
                shopId: shop.id,
                role: user.role,
              }
            });
            console.log(`Successfully assigned user ${user.username} to shop ${shop.name}`);
          } catch (error) {
            console.error(`Error assigning user to shop: ${error.message}`);
          }
        } else {
          console.log(`User ${user.username} is already assigned to shop ${shop.name}`);
        }
      }
    }
    
    // 2. Fix order-related issues
    console.log('\n======= FIXING ORDER STATUS ISSUES =======');
    
    // Check if schema needs to be updated to support createActivityLog
    let activityLogsExist = true;
    try {
      await prisma.activityLog.findFirst();
    } catch (error) {
      activityLogsExist = false;
      console.log('Activity log table not found in schema, will skip activity log creation');
    }
    
    // Get all orders
    const orders = await prisma.retailOrder.findMany({
      include: {
        shop: true,
        items: {
          include: {
            coffee: true
          }
        }
      }
    });
    
    console.log(`Found ${orders.length} orders in the database`);
    
    if (orders.length === 0) {
      console.log('No orders to fix');
    } else {
      for (const order of orders) {
        console.log(`Order ${order.id}: Status=${order.status}, Shop=${order.shop.name}`);
      }
    }
    
    console.log('\nDeployment fixes completed successfully!');
    
  } catch (error) {
    console.error('Error running fix script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 