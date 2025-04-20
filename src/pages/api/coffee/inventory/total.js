import { getServerSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

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
    
    // Create a new Prisma client for this request
    const prisma = new PrismaClient();
    
    // Use direct SQL query instead of Prisma ORM methods
    const rawQuery = `
      SELECT id, name, grade, quantity, country, producer
      FROM "GreenCoffee"
    `;
    
    let coffeeItems;
    
    try {
      // Execute the raw SQL query
      const result = await prisma.$queryRawUnsafe(rawQuery);
      coffeeItems = result;
      console.log(`[api/coffee/inventory/total] Raw query successful, found ${result.length} items`);
    } catch (dbError) {
      console.error('[api/coffee/inventory/total] Database query error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    } finally {
      // Always disconnect the client
      await prisma.$disconnect();
    }

    // Calculate total inventory
    let overallTotal = 0;
    const result = coffeeItems.map(coffee => {
      // Convert quantity to number in case it's returned as string from raw query
      const quantity = parseFloat(coffee.quantity) || 0;
      overallTotal += quantity;
      
      return {
        coffee: {
          id: coffee.id,
          name: coffee.name,
          grade: coffee.grade
        },
        totalQuantity: quantity,
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
    return res.status(200).json({ 
      total: 0, 
      error: `Error fetching inventory data: ${error.message}`, 
      items: [] 
    });
  }
} 