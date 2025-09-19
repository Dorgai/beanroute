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

async function testSimpleOrder() {
  try {
    console.log('=== TESTING SIMPLE ORDER CREATION ===');
    
    // Create a very simple test order
    const testOrder = {
      shopId: "93fcde50-c104-4f15-b590-6ded7c3a90e8",
      items: [
        {
          coffeeId: "0319704d-0a8a-4f2d-ae9f-5d1e9cb19055",
          smallBagsEspresso: 1,
          smallBagsFilter: 0,
          largeBags: 0
        }
      ],
      comment: "Simple test order"
    };
    
    console.log('Creating simple test order...');
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
    console.error('Error testing simple order:', error);
  }
}

testSimpleOrder();

