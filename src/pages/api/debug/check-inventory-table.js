// Debug endpoint to check inventory table structure
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[debug] Checking inventory table...');
    
    // First, try to fetch shops directly (this should work)
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('[debug] Shops query successful:', shops.length);
    
    // Try to query the InventoryEmailNotification table
    let notifications = [];
    let tableError = null;
    
    try {
      notifications = await prisma.inventoryEmailNotification.findMany({
        select: {
          id: true,
          shopId: true,
          alertType: true,
          emails: true,
          isEnabled: true
        }
      });
      console.log('[debug] InventoryEmailNotification query successful:', notifications.length);
    } catch (error) {
      tableError = error.message;
      console.error('[debug] InventoryEmailNotification query failed:', error.message);
    }
    
    // Check table structure using raw query
    let tableStructure = null;
    try {
      tableStructure = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'InventoryEmailNotification' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log('[debug] Table structure query successful');
    } catch (error) {
      console.error('[debug] Table structure query failed:', error.message);
    }
    
    return res.status(200).json({
      success: true,
      shops: {
        count: shops.length,
        data: shops
      },
      notifications: {
        count: notifications.length,
        data: notifications,
        error: tableError
      },
      tableStructure: tableStructure || null
    });
    
  } catch (error) {
    console.error('[debug] Debug check failed:', error);
    return res.status(500).json({ 
      error: 'Debug check failed', 
      details: error.message 
    });
  }
}
