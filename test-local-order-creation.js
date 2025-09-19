// Local test to reproduce the duplicate creation issue
// This simulates the order creation logic without needing a database

// Simulate the processedItems creation logic from create-order.js
function processOrderItems(items) {
  console.log('=== PROCESSING ORDER ITEMS ===');
  console.log('Input items:', JSON.stringify(items, null, 2));
  
  const processedItems = items.map(item => {
    const smallBagsEspresso = parseInt(item.smallBagsEspresso) || 0;
    const smallBagsFilter = parseInt(item.smallBagsFilter) || 0;
    const largeBags = parseInt(item.largeBags) || 0;
    
    // For backward compatibility, if smallBags is provided but not espresso/filter, use it as espresso
    const legacySmallBags = parseInt(item.smallBags) || 0;
    const finalEspresso = smallBagsEspresso || legacySmallBags;
    const finalFilter = smallBagsFilter;
    
    const processedItem = {
      coffeeId: item.coffeeId,
      smallBags: finalEspresso + finalFilter, // Keep for backward compatibility
      smallBagsEspresso: finalEspresso,
      smallBagsFilter: finalFilter,
      largeBags: largeBags,
      totalQuantity: ((finalEspresso + finalFilter) * 0.2) + (largeBags * 1.0)
    };
    
    console.log(`Processed item for coffee ${item.coffeeId}:`, processedItem);
    return processedItem;
  });
  
  console.log('=== FINAL PROCESSED ITEMS ===');
  console.log('Processed items count:', processedItems.length);
  console.log('Processed items:', JSON.stringify(processedItems, null, 2));
  
  return processedItems;
}

// Simulate the order item creation logic
function simulateOrderItemCreation(processedItems) {
  console.log('\n=== SIMULATING ORDER ITEM CREATION ===');
  console.log(`Creating ${processedItems.length} order items`);
  
  const items = processedItems.map((item, index) => {
    console.log(`[create-order] Adding item ${index + 1} for order, coffee ${item.coffeeId}:`, {
      smallBagsEspresso: item.smallBagsEspresso,
      smallBagsFilter: item.smallBagsFilter,
      largeBags: item.largeBags,
      totalQuantity: item.totalQuantity,
      smallBags: item.smallBags // For backward compatibility
    });
    
    // Simulate the database creation
    return {
      id: `item-${index + 1}-${Date.now()}`,
      orderId: 'test-order-id',
      coffeeId: item.coffeeId,
      smallBags: item.smallBags,
      smallBagsEspresso: item.smallBagsEspresso,
      smallBagsFilter: item.smallBagsFilter,
      largeBags: item.largeBags,
      totalQuantity: item.totalQuantity
    };
  });
  
  console.log(`Created ${items.length} order items successfully`);
  return items;
}

// Test with the same data as the production test
function testOrderCreation() {
  console.log('=== TESTING LOCAL ORDER CREATION ===');
  
  // Same test data as production
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
  
  console.log('Test order data:', JSON.stringify(testOrder, null, 2));
  
  // Process the items
  const processedItems = processOrderItems(testOrder.items);
  
  // Simulate creating order items
  const createdItems = simulateOrderItemCreation(processedItems);
  
  console.log('\n=== FINAL RESULT ===');
  console.log('Created items count:', createdItems.length);
  console.log('Created items:', JSON.stringify(createdItems, null, 2));
  
  if (createdItems.length === 1) {
    console.log('✅ SUCCESS: Only 1 item created as expected');
  } else {
    console.log(`❌ ISSUE: ${createdItems.length} items created instead of 1`);
  }
}

// Run the test
testOrderCreation();

