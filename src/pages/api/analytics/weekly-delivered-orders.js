import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

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
      
      console.log('Weekly Analytics API - session user role:', userRole);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Parse parameters - how many weeks to look back
    const { weeks = '8' } = req.query; // Default to 8 weeks if not specified
    const weeksToLookBack = parseInt(weeks, 10);
    
    if (isNaN(weeksToLookBack) || weeksToLookBack <= 0 || weeksToLookBack > 52) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Weeks parameter must be a positive number between 1 and 52' });
    }

    // Calculate the start and end dates for the analysis period
    const today = new Date();
    const startDate = startOfWeek(subWeeks(today, weeksToLookBack - 1));
    const endDate = endOfWeek(today);

    console.log(`Fetching weekly delivered orders between ${startDate} and ${endDate}`);

    // Get all DELIVERED orders in the date range
    const deliveredOrders = await prisma.retailOrder.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            coffee: true
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
    
    console.log(`Found ${deliveredOrders.length} delivered orders in the specified date range`);
    
    // Initialize data structure for weekly data
    const weeklyData = [];
    const shopData = {};
    const allShops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Generate the weeks for the analysis
    for (let i = 0; i < weeksToLookBack; i++) {
      const weekStart = startOfWeek(subWeeks(today, i));
      const weekEnd = endOfWeek(subWeeks(today, i));
      const weekLabel = format(weekStart, 'MMM d') + ' - ' + format(weekEnd, 'MMM d');
      
      const weekData = {
        weekLabel,
        startDate: weekStart,
        endDate: weekEnd,
        byShop: {}, // Will contain data per shop
        aggregated: {
          smallBags: {
            SPECIALTY: 0,
            PREMIUM: 0,
            RARITY: 0
          },
          largeBags: {
            SPECIALTY: 0,
            PREMIUM: 0,
            RARITY: 0
          }
        }
      };
      
      // Initialize data for each shop
      allShops.forEach(shop => {
        weekData.byShop[shop.id] = {
          shopName: shop.name,
          smallBags: {
            SPECIALTY: 0,
            PREMIUM: 0,
            RARITY: 0
          },
          largeBags: {
            SPECIALTY: 0,
            PREMIUM: 0,
            RARITY: 0
          }
        };
        
        // Track shops for the final response
        if (!shopData[shop.id]) {
          shopData[shop.id] = {
            id: shop.id,
            name: shop.name
          };
        }
      });
      
      weeklyData.push(weekData);
    }
    
    // Process orders into weekly buckets
    deliveredOrders.forEach(order => {
      // Determine which week this order belongs to
      const orderDate = new Date(order.updatedAt);
      let weekIndex = -1;
      
      for (let i = 0; i < weeklyData.length; i++) {
        const week = weeklyData[i];
        if (orderDate >= week.startDate && orderDate <= week.endDate) {
          weekIndex = i;
          break;
        }
      }
      
      if (weekIndex === -1) return; // Skip if order doesn't fit in any week
      
      const shopId = order.shop.id;
      
      // Process all items in this order
      order.items.forEach(item => {
        const grade = item.coffee.grade;
        
        // Add to shop-specific data
        if (weeklyData[weekIndex].byShop[shopId]) {
          weeklyData[weekIndex].byShop[shopId].smallBags[grade] += item.smallBags;
          weeklyData[weekIndex].byShop[shopId].largeBags[grade] += item.largeBags;
          
          // Also add to the aggregated totals
          weeklyData[weekIndex].aggregated.smallBags[grade] += item.smallBags;
          weeklyData[weekIndex].aggregated.largeBags[grade] += item.largeBags;
        }
      });
    });
    
    // Prepare the final response
    const result = {
      weeklyData: weeklyData.reverse(), // Most recent week first
      shops: Object.values(shopData)
    };
    
    // Make sure to disconnect the Prisma client
    await prisma.$disconnect();
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in weekly analytics API:', error);
    // Try to disconnect prisma in case of errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch weekly analytics data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 