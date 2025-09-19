const https = require('https');

// Direct duplicate removal script
async function removeDuplicates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'beanroute-production-3421.up.railway.app',
      port: 443,
      path: '/api/retail/orders?status=PENDING&fixDuplicates=true',
      method: 'GET',
      headers: {
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU4MDUxODQ0LCJleHAiOjE3NTg2NTY2NDR9.1A1H1U1QKiwTepB5OGOMYSt8jnie46uP0AuBNwKX_Sg'
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
          console.log('Response received:', response.length, 'orders');
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
    console.log('=== REMOVING DUPLICATES ===');
    
    const result = await removeDuplicates();
    
    console.log('=== COMPLETED ===');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();