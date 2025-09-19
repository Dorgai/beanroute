// Comprehensive test of the PendingOrdersSummary logic

// Constants from PendingOrdersSummary
const SMALL_BAG_SIZE = 0.2; // 200g
const LARGE_BAG_SIZE = 1.0; // 1kg

// Test data that matches your exact scenario
const testOrders = [
  {
    id: 'order-1',
    shopId: 'shop-tripoli',
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

console.log('=== TESTING PENDING ORDERS SUMMARY LOGIC ===\n');

// Test the exact logic from PendingOrdersSummary component
function testPendingOrdersSummary(orders, showShopInfo = false, aggregateAcrossShops = false) {
  console.log(`\n--- Testing with showShopInfo=${showShopInfo}, aggregateAcrossShops=${aggregateAcrossShops} ---`);
  
  // Filter only pending orders (exclude cancelled, delivered, etc.)
  const pendingOrders = orders.filter(order => 
    order && 
    order.status === 'PENDING' && 
    order.status !== 'CANCELLED' && 
    order.status !== 'DELIVERED' &&
    order.status !== 'PROCESSING'
  );
  
  console.log(`Filtered ${pendingOrders.length} pending orders from ${orders.length} total orders`);
  
  // Initialize an object to store aggregated data
  const aggregatedData = {};
  // Store shop breakdowns for each coffee
  const shopBreakdowns = {};

  // Process each pending order
  pendingOrders.forEach((order, orderIndex) => {
    console.log(`\nProcessing order ${orderIndex + 1}: ${order.id} (${order.shop?.name})`);
    
    // Process each item in the order
    if (Array.isArray(order.items)) {
      order.items.forEach((item, itemIndex) => {
        if (!item.coffee || !item.coffee.name) return;
        
        const coffeeName = item.coffee.name;
        const coffeeGrade = item.coffee.grade?.replace('_', ' ') || 'Unknown';
        const shopId = order.shopId || 'unknown';
        const shopName = order.shop?.name || 'Unknown Shop';
        
        console.log(`  Processing item ${itemIndex + 1}: ${coffeeName}`);
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
        let key;
        if (aggregateAcrossShops) {
          key = `${coffeeName}_${coffeeGrade}`;
        } else if (showShopInfo) {
          key = `${coffeeName}_${shopId}`;
        } else {
          key = coffeeName;
        }
        
        console.log(`    Aggregation key: ${key}`);
        
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
        // If bag quantities are 0 but totalQuantity exists, use totalQuantity directly
        let totalKg, espressoKg, filterKg;
        
        if (totalSmallBags === 0 && largeBags === 0 && item.totalQuantity > 0) {
          // Use totalQuantity directly when bag quantities are 0
          totalKg = item.totalQuantity;
          espressoKg = 0;
          filterKg = 0;
          console.log(`    FIXED: Using totalQuantity directly for ${coffeeName}: ${totalKg}kg`);
        } else {
          // Calculate from bag quantities
          totalKg = (totalSmallBags * SMALL_BAG_SIZE) + (largeBags * LARGE_BAG_SIZE);
          espressoKg = actualEspressoBags * SMALL_BAG_SIZE;
          filterKg = actualFilterBags * SMALL_BAG_SIZE;
          console.log(`    Using calculated values: totalKg=${totalKg}, espressoKg=${espressoKg}, filterKg=${filterKg}`);
        }
        
        aggregatedData[key].totalKg += totalKg;
        aggregatedData[key].espressoKg += espressoKg;
        aggregatedData[key].filterKg += filterKg;
        
        console.log(`    Final result: smallBags=${aggregatedData[key].smallBags}, totalKg=${aggregatedData[key].totalKg}`);
      });
    }
  });
  
  // Convert object to array and sort by coffee name
  const result = Object.values(aggregatedData).sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`\nFinal summary data:`, result.map(item => ({
    name: item.name,
    totalKg: item.totalKg,
    smallBags: item.smallBags
  })));
  
  return result;
}

// Test different scenarios
console.log('=== SCENARIO 1: Single order, aggregateAcrossShops=true (Summary of All Pending Orders) ===');
const result1 = testPendingOrdersSummary(testOrders, false, true);

console.log('\n=== SCENARIO 2: Single order, showShopInfo=true (Individual shop view) ===');
const result2 = testPendingOrdersSummary(testOrders, true, false);

console.log('\n=== SCENARIO 3: Test with duplicate orders (to simulate double counting) ===');
const duplicateOrders = [
  ...testOrders,
  {
    id: 'order-2',
    shopId: 'shop-tripoli',
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

const result3 = testPendingOrdersSummary(duplicateOrders, false, true);

console.log('\n=== SCENARIO 4: Test with different data structure (9 small bags) ===');
const testOrdersWithBags = [
  {
    id: 'order-1',
    shopId: 'shop-tripoli',
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

const result4 = testPendingOrdersSummary(testOrdersWithBags, false, true);

console.log('\n=== EXPECTED RESULTS ===');
console.log('Bedecho should show 1.8kg total in all scenarios');
console.log('If any scenario shows 3.6kg, that indicates double counting');
