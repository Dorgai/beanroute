const https = require('https');

// Call the existing orders API with fixDuplicates=true
async function fixDuplicates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'beanroute-production-3421.up.railway.app',
      port: 443,
      path: '/api/retail/orders?status=PENDING&fixDuplicates=true',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Fix duplicates response:', response);
          resolve(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('=== FIXING DUPLICATE ITEMS (SIMPLE APPROACH) ===');
    
    const result = await fixDuplicates();
    
    console.log('=== COMPLETED ===');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
