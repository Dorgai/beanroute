const fetch = require('node-fetch');

async function testEndpoints() {
  try {
    console.log('Testing retail API endpoints...');
    
    // Test shops endpoint first
    console.log('\nTesting /api/shops endpoint:');
    const shopsResponse = await fetch('http://localhost:3003/api/shops');
    const shopsData = await shopsResponse.json();
    console.log('Status:', shopsResponse.status);
    console.log('Shops data:', JSON.stringify(shopsData, null, 2).substring(0, 200) + '...');
    
    if (shopsData.length > 0) {
      const shopId = shopsData[0].id;
      
      // Test retail inventory endpoint
      console.log('\nTesting /api/retail/inventory endpoint:');
      const inventoryResponse = await fetch(`http://localhost:3003/api/retail/inventory?shopId=${shopId}`);
      const inventoryData = await inventoryResponse.json();
      console.log('Status:', inventoryResponse.status);
      console.log('Inventory data:', JSON.stringify(inventoryData, null, 2).substring(0, 200) + '...');
      
      // Test available coffee endpoint
      console.log('\nTesting /api/retail/available-coffee endpoint:');
      const coffeeResponse = await fetch('http://localhost:3003/api/retail/available-coffee');
      const coffeeData = await coffeeResponse.json();
      console.log('Status:', coffeeResponse.status);
      console.log('Available coffee data:', JSON.stringify(coffeeData, null, 2).substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testEndpoints(); 