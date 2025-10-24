const { PrismaClient } = require('@prisma/client');

async function testRailwayDBSchema() {
  console.log('🧪 Testing Railway database schema...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Check if medium bag columns exist in RetailInventory
    console.log('📊 Testing RetailInventory table...');
    const inventoryTest = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'RetailInventory' 
      AND column_name IN ('mediumBagsEspresso', 'mediumBagsFilter')
    `;
    console.log('✅ RetailInventory medium bag columns:', inventoryTest);
    
    // Test 2: Check if medium bag columns exist in RetailOrderItem
    console.log('📊 Testing RetailOrderItem table...');
    const orderItemTest = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'RetailOrderItem' 
      AND column_name IN ('mediumBagsEspresso', 'mediumBagsFilter')
    `;
    console.log('✅ RetailOrderItem medium bag columns:', orderItemTest);
    
    // Test 3: Try to query RetailInventory with medium bag columns
    console.log('📊 Testing RetailInventory query...');
    const inventoryQuery = await prisma.retailInventory.findMany({
      take: 1,
      select: {
        id: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true
      }
    });
    console.log('✅ RetailInventory query successful:', inventoryQuery);
    
    // Test 4: Try to query RetailOrderItem with medium bag columns
    console.log('📊 Testing RetailOrderItem query...');
    const orderItemQuery = await prisma.retailOrderItem.findMany({
      take: 1,
      select: {
        id: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true
      }
    });
    console.log('✅ RetailOrderItem query successful:', orderItemQuery);
    
    console.log('🎉 All database schema tests passed!');
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRailwayDBSchema();
