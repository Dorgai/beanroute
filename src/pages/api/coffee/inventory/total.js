import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('[api/coffee/inventory/total] Processing request');

  // Check for direct access mode (for debugging)
  const bypassAuth = req.query.direct === 'true';

  // Authenticate the request
  let session;
  if (!bypassAuth) {
    try {
      session = await getServerSession(req, res);
      if (!session) {
        console.log('[api/coffee/inventory/total] No valid session found');
        // Return empty result instead of error for header display
        return res.status(200).json({ total: 0, error: 'Unauthorized', items: [] });
      }
      console.log('[api/coffee/inventory/total] Authenticated as user:', session.user?.username || 'unknown');
    } catch (error) {
      console.error('[api/coffee/inventory/total] Error authenticating request:', error);
      // Return empty result instead of error for header display
      return res.status(200).json({ total: 0, error: 'Authentication error', items: [] });
    }
  } else {
    console.log('[api/coffee/inventory/total] AUTH BYPASS MODE - Skipping authentication check');
  }

  // Create new Prisma client for this request
  const prisma = new PrismaClient();

  try {
    console.log('[api/coffee/inventory/total] Fetching inventory data');
    // Fetch total inventory across all shops
    const inventoryItems = await prisma.inventory.findMany({
      include: {
        coffee: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate totals by coffee
    const coffeeTotals = {};
    const coffeeIds = new Set();
    let overallTotal = 0;

    inventoryItems.forEach(item => {
      const coffeeId = item.coffeeId;
      coffeeIds.add(coffeeId);
      
      if (!coffeeTotals[coffeeId]) {
        coffeeTotals[coffeeId] = {
          coffee: item.coffee,
          totalQuantity: 0,
          shops: []
        };
      }
      
      coffeeTotals[coffeeId].totalQuantity += item.quantity;
      overallTotal += item.quantity;
      
      // Add shop to list if not already added
      const shopExists = coffeeTotals[coffeeId].shops.some(s => s.id === item.shopId);
      if (!shopExists) {
        coffeeTotals[coffeeId].shops.push({
          id: item.shopId,
          name: item.shop.name
        });
      }
    });

    // Convert to array for response
    const result = Array.from(coffeeIds).map(id => coffeeTotals[id]);

    console.log(`[api/coffee/inventory/total] Found total: ${overallTotal}kg across ${result.length} coffee types`);
    await prisma.$disconnect();
    return res.status(200).json({ 
      total: overallTotal, 
      items: result 
    });
  } catch (error) {
    console.error('[api/coffee/inventory/total] Error fetching inventory totals:', error);
    await prisma.$disconnect();
    return res.status(200).json({ total: 0, error: 'Error fetching inventory data', items: [] });
  }
} 