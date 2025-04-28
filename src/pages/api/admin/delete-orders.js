import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify secret key
    const secretKey = req.headers['x-secret-key'];
    if (secretKey !== process.env.DELETE_ORDERS_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('Starting deletion process for DELIVERED and CANCELED orders...');

    // Get initial counts
    const initialOrderCount = await prisma.retailOrder.count({
      where: {
        status: {
          in: ['DELIVERED', 'CANCELED']
        }
      }
    });
    const initialInventoryCount = await prisma.retailInventory.count();
    const initialGreenCoffeeCount = await prisma.greenCoffeeInventoryLog.count();
    
    console.log(`Initial counts:
    - Orders to delete: ${initialOrderCount}
    - Inventory items: ${initialInventoryCount}
    - Green coffee inventory logs: ${initialGreenCoffeeCount}`);

    // Delete all RetailOrderItems for DELIVERED and CANCELED orders first
    const deletedItems = await prisma.retailOrderItem.deleteMany({
      where: {
        order: {
          status: {
            in: ['DELIVERED', 'CANCELED']
          }
        }
      }
    });
    console.log(`Deleted ${deletedItems.count} order items`);

    // Delete all DELIVERED and CANCELED RetailOrders
    const deletedOrders = await prisma.retailOrder.deleteMany({
      where: {
        status: {
          in: ['DELIVERED', 'CANCELED']
        }
      }
    });
    console.log(`Deleted ${deletedOrders.count} orders`);

    // Verify final counts
    const finalOrderCount = await prisma.retailOrder.count({
      where: {
        status: {
          in: ['DELIVERED', 'CANCELED']
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