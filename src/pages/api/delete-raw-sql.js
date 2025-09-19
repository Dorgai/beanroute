import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DELETING DUPLICATES WITH RAW SQL ===');
    
    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }
    
    let totalDeleted = 0;
    const results = [];
    
    for (const itemId of itemIds) {
      try {
        console.log(`Deleting item ${itemId}`);
        
        const result = await prisma.$executeRaw`
          DELETE FROM "RetailOrderItem" 
          WHERE id = ${itemId}
        `;
        
        if (result > 0) {
          console.log(`✅ Successfully deleted item ${itemId}`);
          totalDeleted++;
          results.push({ itemId, status: 'deleted' });
        } else {
          console.log(`⚠️  Item ${itemId} not found`);
          results.push({ itemId, status: 'not_found' });
        }
      } catch (error) {
        console.error(`❌ Failed to delete item ${itemId}:`, error.message);
        results.push({ itemId, status: 'error', error: error.message });
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Successfully deleted ${totalDeleted} duplicate items`);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${totalDeleted} duplicate items`,
      totalDeleted,
      results
    });
    
  } catch (error) {
    console.error('Error deleting with raw SQL:', error);
    res.status(500).json({ error: 'Failed to delete items', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
