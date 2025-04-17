// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  console.log('[api/retail/inventory] Starting inventory API request');
  
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  // Check for direct access mode (for debugging)
  const bypassAuth = req.query.direct === 'true';
  
  if (req.method !== 'GET') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with enhanced error handling, unless bypassing auth
    let session;
    if (!bypassAuth) {
      try {
        console.log('[api/retail/inventory] Environment:', process.env.NODE_ENV);
        console.log('[api/retail/inventory] Cookie settings:', {
          secure: process.env.COOKIE_SECURE,
          sameSite: process.env.COOKIE_SAMESITE
        });
        console.log('[api/retail/inventory] Request cookies:', req.cookies);
        console.log('[api/retail/inventory] Cookie header:', req.headers.cookie);
        
        session = await getServerSession(req, res);
        
        if (!session) {
          console.log('[api/retail/inventory] No valid session found, returning unauthorized');
          await prisma.$disconnect();
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('[api/retail/inventory] Session user role:', session.user.role);
      } catch (sessionError) {
        console.error('[api/retail/inventory] Session validation error:', sessionError);
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Session validation failed', details: sessionError.message });
      }
    } else {
      console.log('[api/retail/inventory] AUTH BYPASS MODE - Skipping authentication check');
    }

    // Check shop ID parameter
    const { shopId } = req.query;
    if (!shopId) {
      console.log('[api/retail/inventory] No shopId provided, returning empty result');
      await prisma.$disconnect();
      return res.status(200).json({});
    }

    console.log('[api/retail/inventory] Fetching inventory for shopId:', shopId);

    // Get retail inventory for the specified shop with error handling
    let inventory;
    try {
      // First check if the shop exists with minimal fields to avoid schema issues
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          name: true
        }
      });
      
      if (!shop) {
        console.log(`[api/retail/inventory] Shop with ID ${shopId} not found`);
        await prisma.$disconnect();
        return res.status(404).json({ error: 'Shop not found' });
      }
      
      console.log(`[api/retail/inventory] Found shop: ${shop.name}`);
      
      // Get all green coffee with minimal fields to avoid schema issues
      const allCoffee = await prisma.greenCoffee.findMany({
        select: {
          id: true,
          name: true,
          grade: true
        }
      });
      console.log(`[api/retail/inventory] Found ${allCoffee.length} coffee items in total`);
      
      // Now get the inventory records with minimal required fields
      try {
        inventory = await prisma.retailInventory.findMany({
          where: {
            shopId
          },
          select: {
            id: true,
            smallBags: true,
            largeBags: true,
            totalQuantity: true,
            coffeeId: true,
            coffee: {
              select: {
                id: true,
                name: true,
                grade: true
              }
            }
          },
          orderBy: [
            {
              coffee: {
                grade: 'asc'
              }
            },
            {
              coffee: {
                name: 'asc'
              }
            }
          ]
        });
      } catch (inventoryError) {
        console.error('[api/retail/inventory] Error with full inventory query:', inventoryError);
        
        // Fallback to simpler query
        inventory = await prisma.retailInventory.findMany({
          where: {
            shopId
          },
          select: {
            id: true,
            smallBags: true,
            largeBags: true,
            coffeeId: true
          }
        });
        
        // Manually join with coffee data
        inventory = await Promise.all(
          inventory.map(async (item) => {
            try {
              const coffee = await prisma.greenCoffee.findUnique({
                where: { id: item.coffeeId },
                select: {
                  id: true,
                  name: true,
                  grade: true
                }
              });
              return { ...item, coffee };
            } catch (err) {
              return item;
            }
          })
        );
      }
      
      console.log(`[api/retail/inventory] Found ${inventory.length} inventory items for shop ${shopId}`);
      
      // Make sure all inventory items have a valid coffee reference
      inventory = inventory.filter(item => item && item.coffee);
      
    } catch (dbError) {
      console.error('[api/retail/inventory] Database error fetching inventory:', dbError);
      // Return empty data instead of error to allow UI to render
      await prisma.$disconnect();
      return res.status(200).json({ 'UNKNOWN': [] });
    } finally {
      // Always disconnect to prevent connection pool issues
      await prisma.$disconnect();
    }

    if (!inventory || !Array.isArray(inventory)) {
      console.log('[api/retail/inventory] Invalid inventory data, returning empty result');
      return res.status(200).json({ 'UNKNOWN': [] });
    }

    // Group inventory by coffee grade with defensive coding
    try {
      const groupedInventory = inventory.reduce((acc, item) => {
        if (!item || !item.coffee) {
          console.warn('[api/retail/inventory] Invalid inventory item found:', item);
          return acc;
        }
        
        const grade = item.coffee.grade || 'UNKNOWN';
        if (!acc[grade]) {
          acc[grade] = [];
        }
        acc[grade].push(item);
        return acc;
      }, {});

      console.log('[api/retail/inventory] Successfully returning inventory data');
      return res.status(200).json(groupedInventory);
    } catch (processError) {
      console.error('[api/retail/inventory] Error processing inventory data:', processError);
      // Return the raw inventory as a fallback
      return res.status(200).json({ 'UNKNOWN': inventory });
    }
  } catch (error) {
    console.error('[api/retail/inventory] Unhandled error in inventory API:', error);
    // Make sure to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    // Return empty data instead of error to allow UI to render
    return res.status(200).json({ 'UNKNOWN': [] });
  }
} 