// Test script to verify the fixed calculation logic

// Constants from PendingOrdersSummary
const SMALL_BAG_SIZE = 0.2; // 200g
const LARGE_BAG_SIZE = 1.0; // 1kg

// Test the exact scenario: 1.8kg totalQuantity with 0 bag quantities
const mockOrder = {
  id: 'order-1',
  shopId: 'shop-1',
  status: 'PENDING',
  shop: { name: 'Tripoli' },
  items: [
    {
      coffee: { name: 'Bedecho', grade: 'SPECIALTY' },
      smallBags: 0,
      smallBagsEspresso: 0,
      smallBagsFilter: 0,
      largeBags: 0,
      totalQuantity: 1.8
    }
  ]
};

console.log('=== TESTING FIXED CALCULATION ===\n');

console.log('Mock order data:');
console.log(JSON.stringify(mockOrder, null, 2));

// Simulate the FIXED logic from PendingOrdersSummary
const aggregatedData = {};

mockOrder.items.forEach(item => {
  const coffeeName = item.coffee.name;
  const coffeeGrade = item.coffee.grade?.replace('_', ' ') || 'Unknown';
  const shopId = mockOrder.shopId || 'unknown';
  const shopName = mockOrder.shop?.name || 'Unknown Shop';
  
  console.log(`\nProcessing item: ${coffeeName}`);
  console.log(`  Raw data: smallBags=${item.smallBags}, espressoBags=${item.smallBagsEspresso}, filterBags=${item.smallBagsFilter}, largeBags=${item.largeBags}, totalQuantity=${item.totalQuantity}`);
  
  // Handle both old and new data structure for backward compatibility
  const smallBags = item.smallBags || 0;
  const espressoBags = item.smallBagsEspresso || 0;
  const filterBags = item.smallBagsFilter || 0;
  const largeBags = item.largeBags || 0;
  
  // Determine which data structure to use
  let actualEspressoBags, actualFilterBags, totalSmallBags;
  
  if (espressoBags > 0 || filterBags > 0) {
    // New data structure - use separate espresso/filter fields
    actualEspressoBags = espressoBags;
    actualFilterBags = filterBags;
    totalSmallBags = espressoBags + filterBags;
    console.log(`  Using NEW data structure: espresso=${actualEspressoBags}, filter=${actualFilterBags}, totalSmall=${totalSmallBags}`);
  } else if (smallBags > 0) {
    // Old data structure - treat all smallBags as espresso
    actualEspressoBags = smallBags;
    actualFilterBags = 0;
    totalSmallBags = smallBags;
    console.log(`  Using OLD data structure: espresso=${actualEspressoBags}, filter=${actualFilterBags}, totalSmall=${totalSmallBags}`);
  } else {
    // No data
    actualEspressoBags = 0;
    actualFilterBags = 0;
    totalSmallBags = 0;
    console.log(`  No bag data, using zeros`);
  }
  
  // Create a unique key for aggregation
  const key = coffeeName;
  
  // Initialize entry if it doesn't exist
  if (!aggregatedData[key]) {
    aggregatedData[key] = {
      name: coffeeName,
      grade: coffeeGrade,
      shopId: shopId,
      shopName: shopName,
      smallBags: 0,
      smallBagsEspresso: 0,
      smallBagsFilter: 0,
      largeBags: 0,
      totalKg: 0,
      espressoKg: 0,
      filterKg: 0
    };
    console.log(`  Initialized aggregatedData for ${coffeeName}`);
  }
  
  console.log(`  Before adding: smallBags=${aggregatedData[key].smallBags}, totalKg=${aggregatedData[key].totalKg}`);
  
  // Add to the aggregated data
  aggregatedData[key].smallBagsEspresso += actualEspressoBags;
  aggregatedData[key].smallBagsFilter += actualFilterBags;
  aggregatedData[key].largeBags += largeBags;
  
  // Calculate total small bags from espresso and filter
  aggregatedData[key].smallBags = aggregatedData[key].smallBagsEspresso + aggregatedData[key].smallBagsFilter;
  
  console.log(`  After adding bags: smallBags=${aggregatedData[key].smallBags}, espresso=${aggregatedData[key].smallBagsEspresso}, filter=${aggregatedData[key].smallBagsFilter}`);
  
  // FIXED CALCULATION: Calculate total in kg
  // If bag quantities are 0 but totalQuantity exists, use totalQuantity directly
  let totalKg, espressoKg, filterKg;
  
  if (totalSmallBags === 0 && largeBags === 0 && item.totalQuantity > 0) {
    // Use totalQuantity directly when bag quantities are 0
    totalKg = item.totalQuantity;
    espressoKg = 0;
    filterKg = 0;
    console.log(`  FIXED: Using totalQuantity directly for ${coffeeName}: ${totalKg}kg`);
  } else {
    // Calculate from bag quantities
    totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
    espressoKg = actualEspressoBags * SMALL_BAG_SIZE;
    filterKg = actualFilterBags * SMALL_BAG_SIZE;
    console.log(`  Using calculated values: totalKg=${totalKg}, espressoKg=${espressoKg}, filterKg=${filterKg}`);
  }
  
  aggregatedData[key].totalKg += totalKg;
  aggregatedData[key].espressoKg += espressoKg;
  aggregatedData[key].filterKg += filterKg;
  
  console.log(`  Final result: smallBags=${aggregatedData[key].smallBags}, totalKg=${aggregatedData[key].totalKg}`);
});

console.log('\n=== FINAL RESULTS ===');
Object.values(aggregatedData).forEach(item => {
  console.log(`${item.name}:`);
  console.log(`  Small Bags: ${item.smallBags}`);
  console.log(`  Espresso Bags: ${item.smallBagsEspresso}`);
  console.log(`  Filter Bags: ${item.smallBagsFilter}`);
  console.log(`  Large Bags: ${item.largeBags}`);
  console.log(`  Total Kg: ${item.totalKg}`);
  console.log(`  Espresso Kg: ${item.espressoKg}`);
  console.log(`  Filter Kg: ${item.filterKg}`);
});

console.log('\n=== EXPECTED RESULT ===');
console.log('Bedecho should show 1.8kg total (matching the individual order display)');
