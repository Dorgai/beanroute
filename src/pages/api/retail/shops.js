// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  console.log('[api/retail/shops] Starting shops API request');
  
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  // Check for direct access mode (for debugging)
  const bypassAuth = req.query.direct === 'true';
  
  if (req.method !== 'GET') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with enhanced error handling, unless bypassing auth
    let session;
    if (!bypassAuth) {
      try {
        console.log('[api/retail/shops] Environment:', process.env.NODE_ENV);
        console.log('[api/retail/shops] Cookie settings:', {
          secure: process.env.COOKIE_SECURE,
          sameSite: process.env.COOKIE_SAMESITE
        });
        console.log('[api/retail/shops] Request cookies:', req.cookies);
        console.log('[api/retail/shops] Cookie header:', req.headers.cookie);
        
        session = await getServerSession(req, res);
        
        if (!session) {
          console.log('[api/retail/shops] No valid session found, returning unauthorized');
          await prisma.$disconnect();
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('[api/retail/shops] Session user role:', session.user.role);
      } catch (sessionError) {
        console.error('[api/retail/shops] Session validation error:', sessionError);
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Session validation failed', details: sessionError.message });
      }
    } else {
      console.log('[api/retail/shops] AUTH BYPASS MODE - Skipping authentication check');
    }

    console.log('[api/retail/shops] Fetching shops for retail orders');

    // Get all shops
    let shops;
    try {
      console.log('[api/retail/shops] Executing Prisma query to find shops');
      
      // Try with only essential fields to avoid schema mismatches
      shops = await prisma.shop.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          minCoffeeQuantityLarge: true,
          minCoffeeQuantitySmall: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      console.log(`[api/retail/shops] Found ${shops?.length || 0} shops`);
      
      // Enhanced debugging for production issues
      if (!shops || shops.length === 0) {
        console.log('[api/retail/shops] No shops found in database');
        
        // Check if we can access any data from the database at all
        try {
          const shopCount = await prisma.shop.count();
          console.log(`[api/retail/shops] Shop count verification: ${shopCount}`);
        } catch (countError) {
          console.error('[api/retail/shops] Error counting shops:', countError);
        }
      }
    } catch (dbError) {
      console.error('[api/retail/shops] Database error fetching shops:', dbError);
      
      console.log('[api/retail/shops] Attempting fallback query with minimal fields');
      try {
        // Fallback to absolute minimal fields if there's a schema mismatch
        shops = await prisma.shop.findMany({
          select: {
            id: true,
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        });
        console.log(`[api/retail/shops] Fallback query found ${shops?.length || 0} shops`);
      } catch (fallbackError) {
        console.error('[api/retail/shops] Fallback query also failed:', fallbackError);
        await prisma.$disconnect();
        return res.status(500).json({ 
          error: 'Database error fetching shops',
          details: dbError.message,
          stack: dbError.stack
        });
      }
    } finally {
      // Always disconnect to prevent connection pool issues
      await prisma.$disconnect();
    }

    if (!shops || !Array.isArray(shops)) {
      console.log('[api/retail/shops] Invalid shops data, returning empty array');
      return res.status(200).json([]);
    }

    console.log('[api/retail/shops] Successfully returning shops data');
    return res.status(200).json(shops);
  } catch (error) {
    console.error('[api/retail/shops] Unhandled error in shops API:', error);
    // Make sure to disconnect prisma in case of errors too
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch shops',
      details: error.message,
      stack: error.stack
    });
  }
} 