import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Only allow GET requests
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
    console.log('[api/dashboard/stats] AUTH BYPASS MODE - Skipping authentication check');
  }

  // Create Prisma client
  const prisma = new PrismaClient();

  try {
    // Get dashboard statistics
    const [
      totalOrders,
      ordersByStatus,
      totalShops,
      totalUsers,
      totalCoffees,
      recentOrders
    ] = await Promise.all([
      // Total orders
      prisma.retailOrder.count(),
      
      // Orders by status
      prisma.retailOrder.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Total shops
      prisma.shop.count(),
      
      // Total users
      prisma.user.count(),
      
      // Total coffees
      prisma.coffee.count(),
      
      // Recent orders
      prisma.retailOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: {
            select: { name: true }
          },
          items: {
            include: {
              coffee: { select: { name: true } }
            }
          }
        }
      })
    ]);

    // Format the status counts for easier consumption
    const statusCounts = {
      PENDING: 0,
      PROCESSING: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0
    };
    
    ordersByStatus.forEach(item => {
      statusCounts[item.status] = item._count;
    });

    // Map recent orders to a simpler format
    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      shopName: order.shop?.name || 'Unknown Shop',
      itemCount: order.items?.length || 0
    }));

    // Return formatted statistics
    await prisma.$disconnect();
    return res.status(200).json({
      totalOrders,
      ordersByStatus: statusCounts,
      totalShops,
      totalUsers,
      totalCoffees,
      recentOrders: formattedRecentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
} 