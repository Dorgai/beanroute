const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeployedVersion() {
  try {
    console.log('🔍 Testing what version is actually deployed...');
    
    // Test if the available-coffee API is working
    const response = await fetch('https://beanroute-production.up.railway.app/api/retail/available-coffee?shopId=1bf11648-173d-41d4-96bd-83e7f27c1d39');
    const data = await response.json();
    
    console.log('📊 Available coffee API response:', data);
    
    // Test if the pending orders API is working
    const response2 = await fetch('https://beanroute-production.up.railway.app/api/retail/pending-orders-by-coffee?shopId=1bf11648-173d-41d4-96bd-83e7f27c1d39');
    const data2 = await response2.json();
    
    console.log('📊 Pending orders API response:', data2);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDeployedVersion();
