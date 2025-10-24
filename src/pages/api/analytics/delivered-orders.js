// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  if (req.method !== 'GET') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check user role - only ADMIN, OWNER and RETAILER can access this endpoint
      const userRole = session.user.role;
      if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'RETAILER') {
        await prisma.$disconnect();
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }
      
      console.log('Analytics API - session user role:', userRole);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Parse date parameters
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      await prisma.$disconnect();
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
    groupedData['SPECIALTY'] = { 
      grade: 'Specialty', 
      smallBags: 0, 
      smallBagsEspresso: 0, 
      smallBagsFilter: 0, 
      mediumBags: 0,
      largeBags: 0, 
      orderCount: 0 
    };
    groupedData['PREMIUM'] = { 
      grade: 'Premium', 
      smallBags: 0, 
      smallBagsEspresso: 0, 
      smallBagsFilter: 0, 
      mediumBags: 0,
      largeBags: 0, 
      orderCount: 0 
    };
    groupedData['RARITY'] = { 
      grade: 'Rarity', 
      smallBags: 0, 
      smallBagsEspresso: 0, 
      smallBagsFilter: 0, 
      mediumBags: 0,
      largeBags: 0, 
      orderCount: 0 
    };
    
    // Process orders
    deliveredOrders.forEach(order => {
      // Process all items in the order
      order.items.forEach(item => {
        const grade = item.coffee.grade;
        if (groupedData[grade]) {
          // For backward compatibility, use smallBags if available, otherwise sum espresso + filter
          const totalSmallBags = item.smallBags || (item.smallBagsEspresso + item.smallBagsFilter);
          const espressoBags = item.smallBagsEspresso || 0;
          const filterBags = item.smallBagsFilter || 0;
          const totalMediumBags = (item.mediumBagsEspresso || 0) + (item.mediumBagsFilter || 0);
          
          groupedData[grade].smallBags += totalSmallBags;
          groupedData[grade].smallBagsEspresso += espressoBags;
          groupedData[grade].smallBagsFilter += filterBags;
          groupedData[grade].mediumBags += totalMediumBags;
          groupedData[grade].largeBags += item.largeBags;
          groupedData[grade].orderCount += 1;
        }
      });
    });
    
    // Convert to array and sort by grade
    const result = Object.values(groupedData);
    
    // Make sure to disconnect the Prisma client
    await prisma.$disconnect();
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in analytics API:', error);
    // Try to disconnect prisma in case of errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 