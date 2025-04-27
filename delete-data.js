// Script to delete specific data from Railway production database
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/**
 * This script safely removes production data while preserving system functionality.
 * It deletes:
 * 1. Retail orders
 * 2. Inventory logs and history
 * 3. Green coffee inventory history
 * 4. Most green coffee entries (keeping one)
 * 5. User activity logs
 * 6. Alert logs
 */
async function deleteData() {
  console.log('Starting production data cleanup...');
  
  // Check if running on Railway
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    console.log('Running in Railway environment');
    
    // Use PUBLIC_URL for database connection if available
    if (process.env.DATABASE_PUBLIC_URL) {
      console.log('Using DATABASE_PUBLIC_URL for connection');
      process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
    }
  }
  
  // Create prisma client
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    console.log('Database URL: ' + (process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'Not set'));
    await prisma.$connect();
    
    // First, verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection verified ✓');
    
    // Get database schema information to check available models
    console.log('\nChecking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    // Convert to simple array of table names
    const tableNames = tables.map(t => t.table_name.toLowerCase());
    console.log(`Found ${tableNames.length} tables in database`);

    // Safely perform operations only if tables exist
    console.log('\nStarting data cleanup operations:');
    
    // STEP 1: Delete all retail orders and items
    if (tableNames.includes('retailorderitem')) {
      const deletedOrderItems = await prisma.retailOrderItem.deleteMany({});
      console.log(`✓ Deleted ${deletedOrderItems.count} retail order items`);
    } else {
      console.log('✓ RetailOrderItem table not found, skipping');
    }
    
    if (tableNames.includes('retailorder')) {
      const deletedOrders = await prisma.retailOrder.deleteMany({});
      console.log(`✓ Deleted ${deletedOrders.count} retail orders`);
    } else {
      console.log('✓ RetailOrder table not found, skipping');
    }
    
    // STEP 2: Delete inventory history
    if (tableNames.includes('retailinventoryhistory')) {
      const deletedInventoryHistory = await prisma.retailInventoryHistory.deleteMany({});
      console.log(`✓ Deleted ${deletedInventoryHistory.count} inventory history records`);
    } else {
      console.log('✓ RetailInventoryHistory table not found, skipping');
    }
    
    // STEP 3: Delete alert logs
    if (tableNames.includes('inventoryalertlog')) {
      const deletedAlertLogs = await prisma.inventoryAlertLog.deleteMany({});
      console.log(`✓ Deleted ${deletedAlertLogs.count} inventory alert logs`);
    } else {
      console.log('✓ InventoryAlertLog table not found, skipping');
    }
    
    // STEP 4: Delete retail inventory records completely (must be done before deleting green coffee)
    if (tableNames.includes('retailinventory')) {
      const deletedRetailInventory = await prisma.retailInventory.deleteMany({});
      console.log(`✓ Deleted ${deletedRetailInventory.count} retail inventory records`);
    } else {
      console.log('✓ RetailInventory table not found, skipping');
    }
    
    // STEP 5: Delete green coffee inventory logs and history
    if (tableNames.includes('greencoffeeinventorylog')) {
      const deletedGreenCoffeeInventoryLogs = await prisma.greenCoffeeInventoryLog.deleteMany({});
      console.log(`✓ Deleted ${deletedGreenCoffeeInventoryLogs.count} green coffee inventory logs`);
    } else {
      console.log('✓ GreenCoffeeInventoryLog table not found, skipping');
    }
    
    // STEP 6: Handle green coffee inventory - delete all records first
    if (tableNames.includes('greencoffeeinventory')) {
      const deletedGreenCoffeeInventory = await prisma.greenCoffeeInventory.deleteMany({});
      console.log(`✓ Deleted ${deletedGreenCoffeeInventory.count} green coffee inventory records`);
    } else {
      console.log('✓ GreenCoffeeInventory table not found, skipping');
    }
    
    // STEP 7: Delete most green coffee entries but keep one
    if (tableNames.includes('greencoffee')) {
      // Find one coffee to keep
      const coffeeToKeep = await prisma.greenCoffee.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (coffeeToKeep) {
        // Delete all except the one to keep
        const deletedGreenCoffee = await prisma.greenCoffee.deleteMany({
          where: {
            id: {
              not: coffeeToKeep.id
            }
          }
        });
        console.log(`✓ Deleted ${deletedGreenCoffee.count} green coffee entries (keeping ID: ${coffeeToKeep.id})`);
        
        // Add a small inventory amount to the kept coffee
        await prisma.greenCoffeeInventory.create({
          data: {
            coffeeId: coffeeToKeep.id,
            quantity: 25 // Small amount to show system is working
          }
        });
        console.log(`✓ Added 25kg inventory to kept coffee ID: ${coffeeToKeep.id}`);
      } else {
        console.log('✓ No green coffee entries found to keep');
      }
    } else {
      console.log('✓ GreenCoffee table not found, skipping');
    }
    
    // STEP 8: Clear user activity logs
    if (tableNames.includes('useractivity')) {
      const deletedUserActivity = await prisma.userActivity.deleteMany({});
      console.log(`✓ Deleted ${deletedUserActivity.count} user activity records`);
    } else {
      console.log('✓ UserActivity table not found, skipping');
    }
    
    console.log('\nProduction data cleanup completed successfully');
    console.log('System is ready for production use with clean data');
    
  } catch (error) {
    console.error('Error cleaning production data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
deleteData().catch(error => {
  console.error('Unhandled error during data deletion:', error);
  process.exit(1);
}); 