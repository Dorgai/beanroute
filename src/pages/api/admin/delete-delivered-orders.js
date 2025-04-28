import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    const result = {
      initialCounts: {
        orders: initialOrderCount,
        inventory: initialInventoryCount,
        greenCoffeeInventory: initialGreenCoffeeCount
      },
      deleted: {
        orderItems: deletedItems.count,
        orders: deletedOrders.count
      },
      finalCounts: {
        orders: finalOrderCount,
        inventory: finalInventoryCount,
        greenCoffeeInventory: finalGreenCoffeeCount
      },
      inventoryIntact: finalInventoryCount === initialInventoryCount && 
                      finalGreenCoffeeCount === initialGreenCoffeeCount
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 