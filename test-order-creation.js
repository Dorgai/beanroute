const https = require('https');

// Function to make HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU4MTQyNzIyLCJleHAiOjE3NTg3NDc1MjJ9.LrBXvI3uZwZxNwhWi4e0qw9nj2Bo_5w6t2g_zn3CE08'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOrderCreation() {
  try {
    console.log('=== TESTING ORDER CREATION ===');
    
    // First, get shops to find a valid shop ID
    const shopsResponse = await makeRequest(
      'https://beanroute-production-3421.up.railway.app/api/retail/shops'
    );
    
    if (shopsResponse.status !== 200) {
      console.error('Failed to get shops:', shopsResponse.data);
      return;
    }
    
    const shops = shopsResponse.data;
    if (shops.length === 0) {
      console.error('No shops found');
      return;
    }
    
    const firstShop = shops[0];
    console.log(`Using shop: ${firstShop.name} (ID: ${firstShop.id})`);
    
    // Get available coffee for this shop
    const coffeeResponse = await makeRequest(
      `https://beanroute-production-3421.up.railway.app/api/retail/available-coffee?shopId=${firstShop.id}`
    );
    
    if (coffeeResponse.status !== 200) {
      console.error('Failed to get available coffee:', coffeeResponse.data);
      return;
    }
    
    const availableCoffee = coffeeResponse.data;
    if (availableCoffee.length === 0) {
      console.error('No available coffee found');
      return;
    }
    
    const firstCoffee = availableCoffee[0];
    console.log(`Using coffee: ${firstCoffee.name} (ID: ${firstCoffee.id})`);
    console.log(`Available quantity: ${firstCoffee.availableQuantity}kg`);
    
    
    // Create a test order
    const testOrder = {
      shopId: firstShop.id,
      items: [
        {
          coffeeId: firstCoffee.id,
          smallBagsEspresso: 1,
          smallBagsFilter: 0,
          largeBags: 0
        }
      ],
      comment: 'Test order creation'
    };
    
    console.log('\nCreating test order...');
    console.log('Order data:', JSON.stringify(testOrder, null, 2));
    
    const orderResponse = await makeRequest(
      'https://beanroute-production-3421.up.railway.app/api/retail/create-order',
      'POST',
      testOrder
    );
    
    console.log('\nOrder creation response:');
    console.log('Status:', orderResponse.status);
    console.log('Data:', JSON.stringify(orderResponse.data, null, 2));
    
    if (orderResponse.status === 200) {
      console.log('\n✅ Order creation successful!');
    } else {
      console.log('\n❌ Order creation failed!');
    }
    
  } catch (error) {
    console.error('Error testing order creation:', error);
  }
}

testOrderCreation();
