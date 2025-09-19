// Script to query duplicate orders using Railway CLI
const { exec } = require('child_process');

const query = `
SELECT 
  o.id, 
  o."shopId", 
  o."createdAt",
  s.name as shop_name,
  c.name as coffee_name,
  i."totalQuantity",
  i."smallBags",
  i."smallBagsEspresso",
  i."smallBagsFilter",
  i."largeBags"
FROM "RetailOrder" o
JOIN "Shop" s ON o."shopId" = s.id
JOIN "RetailOrderItem" i ON o.id = i."orderId"
JOIN "GreenCoffee" c ON i."coffeeId" = c.id
WHERE o.status = 'PENDING' 
  AND c.name ILIKE '%bedecho%'
ORDER BY o."createdAt";
`;

console.log('=== QUERYING DUPLICATE BEDECHO ORDERS ===\n');
console.log('Query:', query);
console.log('\nExecuting query...\n');

// Use Railway CLI to execute the query
exec(`railway run --service beanroute "psql \$DATABASE_URL -c \"${query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}\""`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing query:', error);
    return;
  }
  
  if (stderr) {
    console.error('Query stderr:', stderr);
  }
  
  console.log('Query result:');
  console.log(stdout);
  
  // Parse the results to identify duplicates
  const lines = stdout.split('\n');
  const dataLines = lines.filter(line => line.includes('|') && !line.includes('id') && !line.includes('---'));
  
  console.log('\n=== ANALYSIS ===');
  console.log(`Found ${dataLines.length} Bedecho orders`);
  
  if (dataLines.length > 1) {
    console.log('\nDuplicate orders detected!');
    console.log('Orders:');
    dataLines.forEach((line, index) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        console.log(`${index + 1}. Order ID: ${parts[0]}, Shop: ${parts[3]}, Quantity: ${parts[5]}kg, Created: ${parts[2]}`);
      }
    });
    
    console.log('\nRecommendation: Delete the duplicate order(s) to fix the quantity discrepancy.');
  } else {
    console.log('No duplicates found. The issue might be elsewhere.');
  }
});
