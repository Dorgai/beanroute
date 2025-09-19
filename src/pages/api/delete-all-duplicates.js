import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DELETING ALL DUPLICATE BEDECHO ITEMS ===');
    
    // List of duplicate item IDs to delete (keeping the first item from each order)
    const duplicateItemIds = [
      '5aa8cec6-92ed-4a59-bb83-385e308bc9fe', // Ráday duplicate
      '93625967-e01d-488c-ba0f-dd597266d994', // Balassi duplicate  
      '29d4e4d5-0449-4f65-98e5-fcf134edb776'  // Tripoli duplicate
    ];
    
    let totalDeleted = 0;
    
    for (const itemId of duplicateItemIds) {
      try {
        console.log(`Deleting duplicate item ${itemId}`);
        
        const result = await prisma.$executeRaw`
          DELETE FROM "RetailOrderItem" 
          WHERE id = ${itemId}
        `;
        
        if (result > 0) {
          console.log(`Successfully deleted item ${itemId}`);
          totalDeleted++;
        } else {
          console.log(`Item ${itemId} not found or already deleted`);
        }
      } catch (error) {
        console.error(`Failed to delete item ${itemId}:`, error.message);
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Successfully deleted ${totalDeleted} duplicate Bedecho items`);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${totalDeleted} duplicate Bedecho items`,
      totalDeleted 
    });
    
  } catch (error) {
    console.error('Error deleting all duplicates:', error);
    res.status(500).json({ error: 'Failed to delete all duplicates', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
