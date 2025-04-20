import { getServerSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

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
  
  try {
    console.log('[api/coffee/inventory/total] Fetching inventory data');

    // Use direct SQL query if Prisma is having issues
    const rawQuery = `
      SELECT id, name, grade, quantity, country, producer
      FROM "GreenCoffee"
    `;
    
    let coffeeItems;
    try {
      // First try using Prisma's findMany
      coffeeItems = await prisma.greenCoffee.findMany({
        select: {
          id: true,
          name: true,
          grade: true,
          quantity: true,
          country: true,
          producer: true
        }
      });
      console.log('[api/coffee/inventory/total] Successfully used Prisma findMany');
    } catch (prismaError) {
      console.error('[api/coffee/inventory/total] Prisma findMany failed, using raw query:', prismaError);
      // Fallback to raw query
      const result = await prisma.$queryRaw`${rawQuery}`;
      coffeeItems = result;
    }

    // Calculate total inventory
    let overallTotal = 0;
    const result = coffeeItems.map(coffee => {
      overallTotal += coffee.quantity;
      
      return {
        coffee: {
          id: coffee.id,
          name: coffee.name,
          grade: coffee.grade
        },
        totalQuantity: coffee.quantity,
        shops: [] // Shop-specific data isn't available at this level
      };
    });

    console.log(`[api/coffee/inventory/total] Found total: ${overallTotal}kg across ${result.length} coffee types`);
    return res.status(200).json({ 
      total: overallTotal, 
      items: result 
    });
  } catch (error) {
    console.error('[api/coffee/inventory/total] Error fetching inventory totals:', error);
    // Return a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error fetching inventory data: ${error.message}\n${error.stack}` 
      : 'Error fetching inventory data';
      
    return res.status(200).json({ 
      total: 0, 
      error: errorMessage, 
      items: [] 
    });
  } finally {
    // No need to disconnect in Next.js API routes as they're serverless
  }
} 