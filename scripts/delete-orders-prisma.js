const { PrismaClient } = require('@prisma/client');

async function main() {
  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    console.log('Starting deletion process...');

    // Get initial counts
    const initialOrderCount = await prisma.retailOrder.count();
    const initialInventoryCount = await prisma.retailInventory.count();
    
    console.log(`Initial counts:
    - Orders: ${initialOrderCount}
    - Inventory items: ${initialInventoryCount}`);

    // Delete all RetailOrderItems first
    const deletedItems = await prisma.retailOrderItem.deleteMany();
    console.log(`Deleted ${deletedItems.count} order items`);

    // Delete all RetailOrders
    const deletedOrders = await prisma.retailOrder.deleteMany();
    console.log(`Deleted ${deletedOrders.count} orders`);

    // Verify final counts
    const finalOrderCount = await prisma.retailOrder.count();
    const finalInventoryCount = await prisma.retailInventory.count();
    
    console.log(`\nFinal counts:
    - Orders: ${finalOrderCount}
    - Inventory items: ${finalInventoryCount}`);

    if (finalInventoryCount !== initialInventoryCount) {
      console.error('Warning: Inventory count changed during deletion!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error); 