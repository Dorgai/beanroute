const { PrismaClient } = require('@prisma/client');

async function checkTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Run a simple query to check connection
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    // Check tables by running count queries on each model
    console.log('\nChecking tables:');
    
    // User related tables
    console.log(`- User: ${await prisma.user.count()} records`);
    console.log(`- Session: ${await prisma.session.count()} records`);
    console.log(`- Permission: ${await prisma.permission.count()} records`);
    console.log(`- UserActivity: ${await prisma.userActivity.count()} records`);
    
    // Team related tables
    console.log(`- Team: ${await prisma.team.count()} records`);
    console.log(`- UserTeam: ${await prisma.userTeam.count()} records`);
    
    // Shop related tables
    console.log(`- Shop: ${await prisma.shop.count()} records`);
    console.log(`- UserShop: ${await prisma.userShop.count()} records`);
    
    // Coffee related tables
    console.log(`- GreenCoffee: ${await prisma.greenCoffee.count()} records`);
    console.log(`- GreenCoffeeInventoryLog: ${await prisma.greenCoffeeInventoryLog.count()} records`);
    
    // Retail related tables
    console.log(`- RetailOrder: ${await prisma.retailOrder.count()} records`);
    console.log(`- RetailOrderItem: ${await prisma.retailOrderItem.count()} records`);
    console.log(`- RetailInventory: ${await prisma.retailInventory.count()} records`);
    
    console.log('\nAll tables successfully checked!');
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables()
  .then(() => {
    console.log('Database check completed.');
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 