const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Finding a test order to update...');
    
    // Find a pending order
    const order = await prisma.retailOrder.findFirst({
      where: { status: 'PENDING' },
      include: {
        shop: true,
        items: true
      }
    });
    
    if (!order) {
      console.log('No pending orders found. Please create a test order first using create-test-order.js');
      return;
    }
    
    console.log(`Found order: ${order.id}`);
    console.log(`Current status: ${order.status}`);
    
    // Update the order status directly in the database
    const updatedOrder = await prisma.retailOrder.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        updatedAt: new Date()
      }
    });
    
    console.log(`Updated order status: ${updatedOrder.status}`);
    console.log(`The changes should now be reflected in the database.`);
    
    // Provide curl command for testing the API directly
    console.log('\nTo test changing this order status through the API, run:');
    console.log(`curl -X PUT http://localhost:3000/api/retail/update-order-status \\
  -H "Content-Type: application/json" \\
  -d '{"orderId":"${order.id}", "status":"ROASTED"}' \\
  -c cookies.txt`);
    
  } catch (error) {
    console.error('Error updating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 