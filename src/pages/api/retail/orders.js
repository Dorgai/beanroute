import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

// Create a dedicated connection for this API route
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Fetch orders - session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
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

    // Get retail orders with filtering
    try {
      console.log('Executing database query with prisma.retailOrder.findMany()...');
      const orders = await prisma.retailOrder.findMany({
        where: whereCondition,
        include: {
          shop: true,
          orderedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              coffee: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${orders.length} retail orders`);
      return res.status(200).json(orders);
    } catch (dbError) {
      console.error('Database error fetching retail orders:', dbError);
      return res.status(500).json({ 
        error: 'Database error fetching retail orders',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    } finally {
      // Make sure to disconnect to avoid connection pool issues
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Unhandled error in retail orders API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch retail orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 