import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DELETING SPECIFIC DUPLICATE ITEM ===');
    
    // Delete the second duplicate Bedecho item
    const itemIdToDelete = 'cd49cef0-295c-4f1f-acad-6c77edc478ec';
    
    console.log(`Deleting item ${itemIdToDelete}`);
    
    const deletedItem = await prisma.retailOrderItem.delete({
      where: { id: itemIdToDelete }
    });
    
    console.log(`Successfully deleted item:`, {
      id: deletedItem.id,
      totalQuantity: deletedItem.totalQuantity,
      smallBags: deletedItem.smallBags,
      smallBagsEspresso: deletedItem.smallBagsEspresso,
      smallBagsFilter: deletedItem.smallBagsFilter,
      largeBags: deletedItem.largeBags
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted duplicate item ${itemIdToDelete}`,
      deletedItem: {
        id: deletedItem.id,
        totalQuantity: deletedItem.totalQuantity
      }
    });
    
  } catch (error) {
    console.error('Error deleting specific item:', error);
    res.status(500).json({ error: 'Failed to delete specific item', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
