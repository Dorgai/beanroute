import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log('[api/debug/db-test] Starting direct database connection test');
  
  // Create response structure
  const response = {
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      tables: {},
      error: null
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME
    }
  };

  // Test database connection directly
  const prisma = new PrismaClient();
  try {
    console.log('[api/debug/db-test] Testing database connection...');
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    response.database.connected = true;
    console.log('[api/debug/db-test] Database connection successful');
    
    // Count records in key tables
    try {
      response.database.tables.users = await prisma.user.count();
      console.log(`[api/debug/db-test] User count: ${response.database.tables.users}`);
      
      response.database.tables.shops = await prisma.shop.count();
      console.log(`[api/debug/db-test] Shop count: ${response.database.tables.shops}`);
      
      // Fetch one shop for diagnostic purposes
      if (response.database.tables.shops > 0) {
        const firstShop = await prisma.shop.findFirst();
        response.database.sampleShop = {
          id: firstShop.id,
          name: firstShop.name
        };
        console.log(`[api/debug/db-test] Sample shop: ${firstShop.name} (${firstShop.id})`);
        
        // Also check retail inventory
        const inventory = await prisma.retailInventory.findMany({
          where: { shopId: firstShop.id },
          take: 3
        });
        
        response.database.inventoryCount = inventory.length;
        console.log(`[api/debug/db-test] Inventory count for shop: ${inventory.length}`);
        
        if (inventory.length > 0) {
          response.database.sampleInventory = inventory.map(item => ({
            id: item.id,
            coffeeId: item.coffeeId,
            smallBags: item.smallBags,
            largeBags: item.largeBags
          }));
        }
      } else {
        console.log('[api/debug/db-test] No shops found in database');
      }
    } catch (countError) {
      console.error('[api/debug/db-test] Error counting records:', countError);
      response.database.tableError = countError.message;
    }
  } catch (dbError) {
    console.error('[api/debug/db-test] Database connection error:', dbError);
    response.database.connected = false;
    response.database.error = dbError.message;
  } finally {
    await prisma.$disconnect();
    console.log('[api/debug/db-test] Database connection closed');
  }

  // Return diagnostic information
  return res.status(200).json({
    status: response.database.connected ? 'ok' : 'error',
    message: response.database.connected ? 'Database connection successful' : 'Database connection failed',
    ...response
  });
} 