import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

// Single instance to avoid too many connections
let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('[api/dashboard/stats] Processing request');

  // Check for direct access mode (for debugging)
  const bypassAuth = req.query.direct === 'true';

  // Authenticate the request
  let session;
  if (!bypassAuth) {
    try {
      session = await getServerSession(req, res);
      if (!session) {
        console.log('[api/dashboard/stats] No valid session found');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      console.log('[api/dashboard/stats] Authenticated as user:', session.user?.username || 'unknown');
    } catch (error) {
      console.error('[api/dashboard/stats] Error authenticating request:', error);
      return res.status(401).json({ error: 'Authentication error' });
    }
  } else {
    console.log('[api/dashboard/stats] AUTH BYPASS MODE - Skipping authentication check');
  }

  try {
    // Get Prisma instance
    const prisma = getPrismaInstance();
    console.log('[api/dashboard/stats] Fetching statistics');
    
    // Get dashboard statistics
    const [
      totalOrders,
      ordersByStatus,
      totalShops,
      totalUsers,
      usersByStatus,
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
      
      // Users by active status
      prisma.user.groupBy({
        by: ['active'],
        _count: true
      }),
      
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

    // Format user status counts
    let activeUsers = 0;
    let inactiveUsers = 0;
    
    usersByStatus.forEach(item => {
      if (item.active === true) {
        activeUsers = item._count;
      } else {
        inactiveUsers = item._count;
      }
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
    console.log('[api/dashboard/stats] Successfully fetched statistics');
    return res.status(200).json({
      totalOrders,
      ordersByStatus: statusCounts,
      totalShops,
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalCoffees,
      recentOrders: formattedRecentOrders
    });
  } catch (error) {
    console.error('[api/dashboard/stats] Error fetching dashboard statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
} 