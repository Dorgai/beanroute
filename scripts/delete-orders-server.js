const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.get('/delete-orders', async (req, res) => {
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
    
    const result = {
      initialCounts: {
        orders: initialOrderCount,
        inventory: initialInventoryCount
      },
      deleted: {
        orderItems: deletedItems.count,
        orders: deletedOrders.count
      },
      finalCounts: {
        orders: finalOrderCount,
        inventory: finalInventoryCount
      },
      inventoryIntact: finalInventoryCount === initialInventoryCount
    };

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 