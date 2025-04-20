import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

// Use PrismaClient as a singleton to prevent too many connections
// Check if PrismaClient is defined in global scope
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();

// Only assign if we're not in production to avoid memory leaks
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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

    // Fetch green coffee items with their quantities
    const coffeeItems = await prisma.greenCoffee.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        quantity: true,
        country: true,
        producer: true
      }
    }).catch(err => {
      console.error('[api/coffee/inventory/total] Database query error:', err);
      throw new Error(`Database query failed: ${err.message}`);
    });

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
    return res.status(200).json({ total: 0, error: `Error fetching inventory data: ${error.message}`, items: [] });
  }
} 