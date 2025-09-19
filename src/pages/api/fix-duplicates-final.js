import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== FIXING ALL DUPLICATE BEDECHO ITEMS (FINAL) ===');
    
    // List of duplicate item IDs to delete
    const duplicateItemIds = [
      '5aa8cec6-92ed-4a59-bb83-385e308bc9fe', // Ráday duplicate
      '93625967-e01d-488c-ba0f-dd597266d994', // Balassi duplicate  
      '29d4e4d5-0449-4f65-98e5-fcf134edb776'  // Tripoli duplicate
    ];
    
    let totalDeleted = 0;
    const results = [];
    
    for (const itemId of duplicateItemIds) {
      try {
        console.log(`Deleting duplicate item ${itemId}`);
        
        const result = await prisma.$executeRaw`
          DELETE FROM "RetailOrderItem" 
          WHERE id = ${itemId}
        `;
        
        if (result > 0) {
          console.log(`✅ Successfully deleted item ${itemId}`);
          totalDeleted++;
          results.push({ itemId, status: 'deleted' });
        } else {
          console.log(`⚠️  Item ${itemId} not found or already deleted`);
          results.push({ itemId, status: 'not_found' });
        }
      } catch (error) {
        console.error(`❌ Failed to delete item ${itemId}:`, error.message);
        results.push({ itemId, status: 'error', error: error.message });
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Successfully deleted ${totalDeleted} duplicate Bedecho items`);
    
    // Verify the fix by checking remaining Bedecho items
    console.log('\n=== VERIFICATION ===');
    const remainingItems = await prisma.$queryRaw`
      SELECT 
        roi.id,
        roi."totalQuantity",
        roi."smallBags",
        roi."smallBagsEspresso", 
        roi."smallBagsFilter",
        roi."largeBags",
        gc.name as coffee_name,
        s.name as shop_name
      FROM "RetailOrderItem" roi
      JOIN "GreenCoffee" gc ON roi."coffeeId" = gc.id
      JOIN "RetailOrder" ro ON roi."orderId" = ro.id
      JOIN "Shop" s ON ro."shopId" = s.id
      WHERE gc.name = 'Bedecho' 
      AND ro.status = 'PENDING'
      ORDER BY s.name, roi."totalQuantity"
    `;
    
    console.log('Remaining Bedecho items:');
    const shopTotals = {};
    remainingItems.forEach(item => {
      const shopName = item.shop_name;
      const quantity = parseFloat(item.totalQuantity);
      shopTotals[shopName] = (shopTotals[shopName] || 0) + quantity;
      console.log(`  ${shopName}: ${quantity}kg (${item.smallBagsEspresso} small bags)`);
    });
    
    console.log('\nShop totals after fix:');
    Object.entries(shopTotals).forEach(([shop, total]) => {
      console.log(`  ${shop}: ${total}kg`);
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${totalDeleted} duplicate Bedecho items`,
      totalDeleted,
      results,
      remainingItems: remainingItems.length,
      shopTotals
    });
    
  } catch (error) {
    console.error('Error fixing duplicates (final):', error);
    res.status(500).json({ error: 'Failed to fix duplicates', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}