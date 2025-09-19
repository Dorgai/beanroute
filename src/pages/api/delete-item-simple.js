import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DELETING DUPLICATE ITEM (SIMPLE) ===');
    
    // Delete the second duplicate Bedecho item
    const itemIdToDelete = 'cd49cef0-295c-4f1f-acad-6c77edc478ec';
    
    console.log(`Deleting item ${itemIdToDelete}`);
    
    // Use raw SQL to avoid schema issues
    const result = await prisma.$executeRaw`
      DELETE FROM "RetailOrderItem" 
      WHERE id = ${itemIdToDelete}
    `;
    
    console.log(`Raw SQL delete result:`, result);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted duplicate item ${itemIdToDelete}`,
      deletedCount: result
    });
    
  } catch (error) {
    console.error('Error deleting item (simple):', error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
