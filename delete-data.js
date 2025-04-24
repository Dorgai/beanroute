// Script to delete specific data from Railway production database
const { PrismaClient } = require('@prisma/client');

/**
 * This script safely removes production data while preserving system functionality.
 * It deletes:
 * 1. Retail orders
 * 2. Inventory logs and history
 * 3. Green coffee inventory (resets to 0)
 * 4. User activity logs
 * 5. Alert logs
 */
async function deleteData() {
  console.log('Starting production data cleanup...');
  
  // Create prisma client
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
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
    
    // STEP 4: Reset green coffee inventory to 0
    if (tableNames.includes('greencoffeeinventory')) {
      const updatedGreenCoffee = await prisma.greenCoffeeInventory.updateMany({
        data: {
          quantity: 0
        }
      });
      console.log(`✓ Reset ${updatedGreenCoffee.count} green coffee inventory records to 0 kg`);
    } else {
      console.log('✓ GreenCoffeeInventory table not found, skipping');
    }
    
    // STEP 5: Reset retail inventory to 0 (small and large bags)
    if (tableNames.includes('retailinventory')) {
      const updatedRetailInventory = await prisma.retailInventory.updateMany({
        data: {
          smallBags: 0,
          largeBags: 0,
          totalQuantity: 0
        }
      });
      console.log(`✓ Reset ${updatedRetailInventory.count} retail inventory records to 0`);
    } else {
      console.log('✓ RetailInventory table not found, skipping');
    }
    
    // STEP 6: Clear user activity logs
    if (tableNames.includes('useractivity')) {
      const deletedUserActivity = await prisma.userActivity.deleteMany({});
      console.log(`✓ Deleted ${deletedUserActivity.count} user activity records`);
    } else {
      console.log('✓ UserActivity table not found, skipping');
    }
    
    // STEP 7: Create a minimal green coffee entry to prevent system errors
    if (tableNames.includes('greencoffee') && tableNames.includes('greencoffeeinventory')) {
      // Find existing green coffee items
      const coffeeItems = await prisma.greenCoffee.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' }
      });
      
      // If there are coffee entries, update one with minimal inventory
      if (coffeeItems && coffeeItems.length > 0) {
        try {
          // Add small inventory to the first coffee to prevent "no coffee" errors
          await prisma.greenCoffeeInventory.upsert({
            where: {
              coffeeId: coffeeItems[0].id
            },
            update: {
              quantity: 5 // Small amount to show system is working
            },
            create: {
              coffeeId: coffeeItems[0].id,
              quantity: 5
            }
          });
          console.log(`✓ Added minimal inventory (5kg) to coffee ID: ${coffeeItems[0].id}`);
        } catch (error) {
          console.error('Error updating coffee inventory:', error.message);
          // Try an alternative approach if upsert fails
          await prisma.greenCoffeeInventory.updateMany({
            where: { coffeeId: coffeeItems[0].id },
            data: { quantity: 5 }
          });
          console.log(`✓ Alternative: Updated inventory for coffee ID: ${coffeeItems[0].id}`);
        }
      } else {
        console.log('✓ No coffee items found, skipping inventory initialization');
      }
    } else {
      console.log('✓ GreenCoffee or GreenCoffeeInventory table not found, skipping inventory setup');
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