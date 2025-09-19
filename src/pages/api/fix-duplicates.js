import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Skip authentication for one-time duplicate fix
  try {
    console.log('=== FIXING DUPLICATE ORDERS ===\n');

    // Find all pending orders
    const pendingOrders = await prisma.retailOrder.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            coffee: true
          }
        },
        shop: true
      }
    });

    console.log(`Found ${pendingOrders.length} pending orders`);

    // Group orders by shop and coffee type
    const orderGroups = {};

    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        const key = `${order.shop?.name || 'Unknown'}_${item.coffee.name}`;
        if (!orderGroups[key]) {
          orderGroups[key] = [];
        }
        orderGroups[key].push({
          orderId: order.id,
          shopName: order.shop?.name || 'Unknown',
          coffeeName: item.coffee.name,
          totalQuantity: item.totalQuantity,
          createdAt: order.createdAt,
          itemId: item.id
        });
      });
    });

    const duplicates = [];
    const ordersToDelete = [];

    // Find duplicates
    Object.entries(orderGroups).forEach(([key, orders]) => {
      if (orders.length > 1) {
        // Sort by creation date (keep oldest)
        const sortedOrders = orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keepOrder = sortedOrders[0];
        const deleteOrders = sortedOrders.slice(1);

        duplicates.push({
          key,
          keep: keepOrder,
          delete: deleteOrders
        });

        ordersToDelete.push(...deleteOrders.map(o => o.orderId));
      }
    });

    console.log(`Found ${duplicates.length} duplicate groups`);
    console.log(`Orders to delete: ${ordersToDelete.length}`);

    // Delete duplicate orders
    let deletedCount = 0;
    for (const orderId of ordersToDelete) {
      try {
        await prisma.retailOrder.delete({
          where: { id: orderId }
        });
        deletedCount++;
        console.log(`Deleted duplicate order: ${orderId}`);
      } catch (error) {
        console.error(`Failed to delete order ${orderId}:`, error.message);
      }
    }

    const result = {
      success: true,
      totalPendingOrders: pendingOrders.length,
      duplicateGroups: duplicates.length,
      ordersDeleted: deletedCount,
      duplicates: duplicates.map(dup => ({
        key: dup.key,
        kept: dup.keep.orderId,
        deleted: dup.delete.map(o => o.orderId)
      }))
    };

    console.log(`\n=== FIX COMPLETE ===`);
    console.log(`Deleted ${deletedCount} duplicate orders`);
    console.log(`Fixed ${duplicates.length} duplicate groups`);

    res.status(200).json(result);

  } catch (error) {
    console.error('Error fixing duplicates:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
