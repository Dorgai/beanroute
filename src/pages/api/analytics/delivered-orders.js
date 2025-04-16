import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

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
      
      // Check user role - only ADMIN, OWNER and RETAILER can access this endpoint
      const userRole = session.user.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'RETAILER') {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }
      
      console.log('Analytics API - session user role:', userRole);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Parse date parameters
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    console.log(`Fetching analytics data for delivered orders between ${parsedStartDate} and ${parsedEndDate}`);
    
    // Get all DELIVERED orders in the date range
    const deliveredOrders = await prisma.retailOrder.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: {
          gte: parsedStartDate,
          lte: parsedEndDate
        }
      },
      include: {
        items: {
          include: {
            coffee: true
          }
        }
      }
    });
    
    console.log(`Found ${deliveredOrders.length} delivered orders in the specified date range`);
    
    // Group the data by coffee grade
    const groupedData = {};
    
    // Initialize the object with all coffee grades
    groupedData['SPECIALTY'] = { grade: 'Specialty', smallBags: 0, largeBags: 0, orderCount: 0 };
    groupedData['PREMIUM'] = { grade: 'Premium', smallBags: 0, largeBags: 0, orderCount: 0 };
    groupedData['RARITY'] = { grade: 'Rarity', smallBags: 0, largeBags: 0, orderCount: 0 };
    
    // Process orders
    deliveredOrders.forEach(order => {
      // Process all items in the order
      order.items.forEach(item => {
        const grade = item.coffee.grade;
        if (groupedData[grade]) {
          groupedData[grade].smallBags += item.smallBags;
          groupedData[grade].largeBags += item.largeBags;
          groupedData[grade].orderCount += 1;
        }
      });
    });
    
    // Convert to array and sort by grade
    const result = Object.values(groupedData);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in analytics API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 