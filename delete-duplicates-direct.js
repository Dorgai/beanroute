const https = require('https');

// Function to make HTTP request
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU4MDUxODQ0LCJleHAiOjE3NTg2NTY2NDR9.1A1H1U1QKiwTepB5OGOMYSt8jnie46uP0AuBNwKX_Sg'
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

async function deleteDuplicates() {
  try {
    console.log('=== DELETING DUPLICATE BEDECHO ITEMS ===');
    
    // List of duplicate item IDs to delete
    const duplicateItemIds = [
      '5aa8cec6-92ed-4a59-bb83-385e308bc9fe', // Ráday duplicate
      '93625967-e01d-488c-ba0f-dd597266d994', // Balassi duplicate  
      '29d4e4d5-0449-4f65-98e5-fcf134edb776'  // Tripoli duplicate
    ];
    
    let totalDeleted = 0;
    
    for (const itemId of duplicateItemIds) {
      try {
        console.log(`Deleting duplicate item ${itemId}`);
        
        // Use the delete-specific-item API with the item ID
        const response = await makeRequest(
          `https://beanroute-production-3421.up.railway.app/api/delete-specific-item`,
          'POST',
          { itemId: itemId }
        );
        
        if (response.status === 200) {
          console.log(`✅ Successfully deleted item ${itemId}`);
          totalDeleted++;
        } else {
          console.log(`❌ Failed to delete item ${itemId}:`, response.data);
        }
      } catch (error) {
        console.error(`❌ Error deleting item ${itemId}:`, error.message);
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Successfully deleted ${totalDeleted} duplicate Bedecho items`);
    
    // Verify by checking the pending orders
    console.log('\n=== VERIFICATION ===');
    const response = await makeRequest(
      'https://beanroute-production-3421.up.railway.app/api/retail/pending-orders-by-coffee'
    );
    
    if (response.status === 200) {
      const bedecho = response.data.find(item => item.name === 'Bedecho');
      if (bedecho) {
        console.log('Bedecho quantities after fix:');
        Object.entries(bedecho.shopBreakdown || {}).forEach(([shop, data]) => {
          console.log(`  ${shop}: ${data.totalKg}kg`);
        });
      }
    } else {
      console.log('Could not verify - API returned:', response.data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteDuplicates();
