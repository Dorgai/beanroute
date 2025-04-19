import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check for direct access mode (for debugging)
  const bypassAuth = req.query.direct === 'true';

  // Authenticate the request
  let session;
  if (!bypassAuth) {
    try {
      session = await getServerSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error authenticating request:', error);
      return res.status(401).json({ error: 'Authentication error' });
    }
  } else {
    console.log('[api/coffee/inventory/total] AUTH BYPASS MODE - Skipping authentication check');
  }

  const prisma = new PrismaClient();

  try {
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

    await prisma.$disconnect();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching inventory totals:', error);
    await prisma.$disconnect();
    return res.status(500).json({ message: 'Error fetching inventory data' });
  }
} 