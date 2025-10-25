const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSchema() {
  try {
    console.log('🔍 Testing Railway database schema...');
    
    // Test RetailInventory table structure
    const sampleInventory = await prisma.retailInventory.findFirst({
      select: {
        id: true,
        shopId: true,
        coffeeId: true,
        smallBags: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true,
        totalQuantity: true,
      },
    });
    
    console.log('📊 Sample RetailInventory record:', sampleInventory);
    
    // Test RetailOrderItem table structure
    const sampleOrderItem = await prisma.retailOrderItem.findFirst({
      select: {
        id: true,
        orderId: true,
        coffeeId: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true,
        totalQuantity: true,
      },
    });
    
    console.log('📊 Sample RetailOrderItem record:', sampleOrderItem);
    
    console.log('✅ Schema test completed successfully');
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    if (error.code === 'P2022') {
      console.error('❌ Column does not exist:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();
