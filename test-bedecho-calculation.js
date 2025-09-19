// Test script to simulate the exact calculation logic from PendingOrdersSummary

// Constants from PendingOrdersSummary
const SMALL_BAG_SIZE = 0.2; // 200g
const LARGE_BAG_SIZE = 1.0; // 1kg

// Simulate the exact data structure that would come from the orders API
const mockOrders = [
  {
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
  }
];

console.log('=== TESTING BEDECHO CALCULATION ===\n');

console.log('Mock order data:');
console.log(JSON.stringify(mockOrders, null, 2));

// Simulate the exact logic from PendingOrdersSummary
const aggregatedData = {};
const shopBreakdowns = {};

mockOrders.forEach(order => {
  console.log(`\nProcessing order: ${order.id}`);
  
  if (Array.isArray(order.items)) {
    order.items.forEach(item => {
      if (!item.coffee || !item.coffee.name) return;
      
      const coffeeName = item.coffee.name;
      const coffeeGrade = item.coffee.grade?.replace('_', ' ') || 'Unknown';
      const shopId = order.shopId || 'unknown';
      const shopName = order.shop?.name || 'Unknown Shop';
      
      console.log(`  Processing item: ${coffeeName}`);
      console.log(`    Raw data: smallBags=${item.smallBags}, espressoBags=${item.smallBagsEspresso}, filterBags=${item.smallBagsFilter}, largeBags=${item.largeBags}, totalQuantity=${item.totalQuantity}`);
      
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
        console.log(`    Using NEW data structure: espresso=${actualEspressoBags}, filter=${actualFilterBags}, totalSmall=${totalSmallBags}`);
      } else if (smallBags > 0) {
        // Old data structure - treat all smallBags as espresso
        actualEspressoBags = smallBags;
        actualFilterBags = 0;
        totalSmallBags = smallBags;
        console.log(`    Using OLD data structure: espresso=${actualEspressoBags}, filter=${actualFilterBags}, totalSmall=${totalSmallBags}`);
      } else {
        // No data
        actualEspressoBags = 0;
        actualFilterBags = 0;
        totalSmallBags = 0;
        console.log(`    No bag data, using zeros`);
      }
      
      // Create a unique key for aggregation
      const key = coffeeName; // Simplified for this test
      
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
        console.log(`    Initialized aggregatedData for ${coffeeName}`);
      }
      
      console.log(`    Before adding: smallBags=${aggregatedData[key].smallBags}, totalKg=${aggregatedData[key].totalKg}`);
      
      // Add to the aggregated data
      aggregatedData[key].smallBagsEspresso += actualEspressoBags;
      aggregatedData[key].smallBagsFilter += actualFilterBags;
      aggregatedData[key].largeBags += largeBags;
      
      // Calculate total small bags from espresso and filter
      aggregatedData[key].smallBags = aggregatedData[key].smallBagsEspresso + aggregatedData[key].smallBagsFilter;
      
      console.log(`    After adding bags: smallBags=${aggregatedData[key].smallBags}, espresso=${aggregatedData[key].smallBagsEspresso}, filter=${aggregatedData[key].smallBagsFilter}`);
      
      // Calculate total in kg (using the correct small bag size of 200g)
      const totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
      const espressoKg = actualEspressoBags * SMALL_BAG_SIZE;
      const filterKg = actualFilterBags * SMALL_BAG_SIZE;
      
      console.log(`    Calculated kg: totalKg=${totalKg}, espressoKg=${espressoKg}, filterKg=${filterKg}`);
      
      aggregatedData[key].totalKg += totalKg;
      aggregatedData[key].espressoKg += espressoKg;
      aggregatedData[key].filterKg += filterKg;
      
      console.log(`    Final result: smallBags=${aggregatedData[key].smallBags}, totalKg=${aggregatedData[key].totalKg}`);
    });
  }
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

// Test with different data scenarios
console.log('\n=== TESTING DIFFERENT SCENARIOS ===');

// Scenario 1: Order with 1.8kg totalQuantity but no bag data
console.log('\nScenario 1: 1.8kg totalQuantity, no bag data');
const scenario1 = [
  {
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
  }
];

// Process scenario 1
const aggregatedData1 = {};
scenario1.forEach(order => {
  order.items.forEach(item => {
    const coffeeName = item.coffee.name;
    const smallBags = item.smallBags || 0;
    const espressoBags = item.smallBagsEspresso || 0;
    const filterBags = item.smallBagsFilter || 0;
    const largeBags = item.largeBags || 0;
    
    let actualEspressoBags, actualFilterBags, totalSmallBags;
    
    if (espressoBags > 0 || filterBags > 0) {
      actualEspressoBags = espressoBags;
      actualFilterBags = filterBags;
      totalSmallBags = espressoBags + filterBags;
    } else if (smallBags > 0) {
      actualEspressoBags = smallBags;
      actualFilterBags = 0;
      totalSmallBags = smallBags;
    } else {
      actualEspressoBags = 0;
      actualFilterBags = 0;
      totalSmallBags = 0;
    }
    
    if (!aggregatedData1[coffeeName]) {
      aggregatedData1[coffeeName] = {
        name: coffeeName,
        smallBags: 0,
        totalKg: 0
      };
    }
    
    aggregatedData1[coffeeName].smallBags += totalSmallBags;
    const totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
    aggregatedData1[coffeeName].totalKg += totalKg;
    
    console.log(`  Result: smallBags=${aggregatedData1[coffeeName].smallBags}, totalKg=${aggregatedData1[coffeeName].totalKg}`);
  });
});

// Scenario 2: Order with 9 small bags (which should equal 1.8kg)
console.log('\nScenario 2: 9 small bags (should equal 1.8kg)');
const scenario2 = [
  {
    id: 'order-1',
    shopId: 'shop-1',
    status: 'PENDING',
    shop: { name: 'Tripoli' },
    items: [
      {
        coffee: { name: 'Bedecho', grade: 'SPECIALTY' },
        smallBags: 9,
        smallBagsEspresso: 0,
        smallBagsFilter: 0,
        largeBags: 0,
        totalQuantity: 1.8
      }
    ]
  }
];

// Process scenario 2
const aggregatedData2 = {};
scenario2.forEach(order => {
  order.items.forEach(item => {
    const coffeeName = item.coffee.name;
    const smallBags = item.smallBags || 0;
    const espressoBags = item.smallBagsEspresso || 0;
    const filterBags = item.smallBagsFilter || 0;
    const largeBags = item.largeBags || 0;
    
    let actualEspressoBags, actualFilterBags, totalSmallBags;
    
    if (espressoBags > 0 || filterBags > 0) {
      actualEspressoBags = espressoBags;
      actualFilterBags = filterBags;
      totalSmallBags = espressoBags + filterBags;
    } else if (smallBags > 0) {
      actualEspressoBags = smallBags;
      actualFilterBags = 0;
      totalSmallBags = smallBags;
    } else {
      actualEspressoBags = 0;
      actualFilterBags = 0;
      totalSmallBags = 0;
    }
    
    if (!aggregatedData2[coffeeName]) {
      aggregatedData2[coffeeName] = {
        name: coffeeName,
        smallBags: 0,
        totalKg: 0
      };
    }
    
    aggregatedData2[coffeeName].smallBags += totalSmallBags;
    const totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
    aggregatedData2[coffeeName].totalKg += totalKg;
    
    console.log(`  Result: smallBags=${aggregatedData2[coffeeName].smallBags}, totalKg=${aggregatedData2[coffeeName].totalKg}`);
  });
});
