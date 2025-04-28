import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to delete all retail orders...');
    
    // First, get a count of orders to be deleted
    const orderCount = await prisma.retailOrder.count();
    console.log(`Found ${orderCount} orders to delete`);
    
    // Delete all retail orders (this will cascade delete order items)
    const result = await prisma.retailOrder.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} orders`);
    
    // Verify deletion
    const remainingOrders = await prisma.retailOrder.count();
    console.log(`Remaining orders: ${remainingOrders}`);
    
    // Verify inventory is still intact
    const inventoryCount = await prisma.retailInventory.count();
    console.log(`Inventory records still intact: ${inventoryCount}`);
    
  } catch (error) {
    console.error('Error deleting orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 