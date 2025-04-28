const { PrismaClient, OrderStatus } = require('@prisma/client');

// Create Prisma client with the direct database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PUBLIC_URL
    }
  }
});

async function main() {
  try {
    console.log('Starting deletion process for DELIVERED and CANCELLED orders...');

    // Get initial counts
    const initialOrderCount = await prisma.retailOrder.count({
      where: {
        status: {
          in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
        }
      }
    });
    const initialInventoryCount = await prisma.retailInventory.count();
    const initialGreenCoffeeCount = await prisma.greenCoffeeInventoryLog.count();
    
    console.log(`Initial counts:
    - Orders to delete: ${initialOrderCount}
    - Inventory items: ${initialInventoryCount}
    - Green coffee inventory logs: ${initialGreenCoffeeCount}`);

    // Delete all RetailOrderItems for DELIVERED and CANCELLED orders first
    const deletedItems = await prisma.retailOrderItem.deleteMany({
      where: {
        order: {
          status: {
            in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
          }
        }
      }
    });
    console.log(`Deleted ${deletedItems.count} order items`);

    // Delete all DELIVERED and CANCELLED RetailOrders
    const deletedOrders = await prisma.retailOrder.deleteMany({
      where: {
        status: {
          in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
        }
      }
    });
    console.log(`Deleted ${deletedOrders.count} orders`);

    // Verify final counts
    const finalOrderCount = await prisma.retailOrder.count({
      where: {
        status: {
          in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
        }
      }
    });
    const finalInventoryCount = await prisma.retailInventory.count();
    const finalGreenCoffeeCount = await prisma.greenCoffeeInventoryLog.count();
    
    console.log(`\nFinal counts:
    - Remaining orders: ${finalOrderCount}
    - Inventory items: ${finalInventoryCount}
    - Green coffee inventory logs: ${finalGreenCoffeeCount}`);

    if (finalInventoryCount !== initialInventoryCount || 
        finalGreenCoffeeCount !== initialGreenCoffeeCount) {
      console.error('Warning: Inventory counts changed during deletion!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 