import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

// Create a dedicated connection for this API route
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for direct access mode (for debugging)
    const bypassAuth = req.query.direct === 'true';
    
    // Get user session with error handling
    let session;
    if (!bypassAuth) {
      try {
        session = await getServerSession(req, res);
        if (!session) {
          await prisma.$disconnect();
          return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('Fetch orders - session user role:', session.user.role);
      } catch (sessionError) {
        console.error('Session error:', sessionError);
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Session validation failed' });
      }
    } else {
      console.log('[api/retail/orders] AUTH BYPASS MODE - Skipping authentication check');
    }

    // We are now allowing roaster users to view orders (removed restriction)
    // Roasters need access to view and manage order statuses

    // Get query parameters for filtering
    const { shopId, status } = req.query;
    
    console.log('Fetching retail orders with filters:', { shopId, status });

    // Build where condition based on filters
    const whereCondition = {};
    
    if (shopId) {
      whereCondition.shopId = shopId;
    }
    
    if (status) {
      whereCondition.status = status;
    }

    // Check if the shop exists
    if (shopId) {
      try {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true }
        });
        
        if (!shop) {
          console.log(`Shop with ID ${shopId} not found`);
          await prisma.$disconnect();
          return res.status(200).json([]); // Return empty array instead of error
        }
      } catch (shopError) {
        console.error('Error checking shop:', shopError);
        // Continue execution - don't fail because of this
      }
    }

    // Get retail orders with minimal fields first
    let orders = [];
    try {
      console.log('Executing database query with prisma.retailOrder.findMany() using minimal fields...');
      
      // First get just the basic orders
      orders = await prisma.retailOrder.findMany({
        where: whereCondition,
        select: {
          id: true,
          shopId: true,
          orderedById: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${orders.length} retail orders`);
      
      if (orders.length === 0) {
        await prisma.$disconnect();
        return res.status(200).json([]);
      }
      
      // Get order items separately
      const orderIds = orders.map(order => order.id);
      const orderItems = await prisma.retailOrderItem.findMany({
        where: {
          orderId: { in: orderIds }
        },
        select: {
          id: true,
          orderId: true,
          coffeeId: true,
          smallBags: true,
          largeBags: true,
          totalQuantity: true,
          coffee: {
            select: {
              id: true,
              name: true,
              grade: true
            }
          }
        }
      });
      
      // Get users separately
      const userIds = [...new Set(orders.map(order => order.orderedById))];
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      });
      
      // Get shops separately
      const shopIds = [...new Set(orders.map(order => order.shopId))];
      const shops = await prisma.shop.findMany({
        where: {
          id: { in: shopIds }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Combine data
      const enrichedOrders = orders.map(order => {
        const orderItemsForOrder = orderItems.filter(item => item.orderId === order.id);
        const user = users.find(u => u.id === order.orderedById);
        const shop = shops.find(s => s.id === order.shopId);
        
        return {
          ...order,
          items: orderItemsForOrder,
          orderedBy: user || { id: order.orderedById, username: 'Unknown User' },
          shop: shop || { id: order.shopId, name: 'Unknown Shop' }
        };
      });
      
      await prisma.$disconnect();
      return res.status(200).json(enrichedOrders);
    } catch (dbError) {
      console.error('Database error fetching retail orders:', dbError);
      
      // Try a more minimal approach
      try {
        console.log('Trying a more minimal query for orders...');
        orders = await prisma.retailOrder.findMany({
          where: whereCondition,
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        await prisma.$disconnect();
        return res.status(200).json(orders);
      } catch (fallbackError) {
        console.error('Even minimal orders query failed:', fallbackError);
        await prisma.$disconnect();
        return res.status(200).json([]); // Return empty array instead of error
      }
    }
  } catch (error) {
    console.error('Unhandled error in retail orders API:', error);
    // Make sure to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(200).json([]); // Return empty array instead of error
  }
} 