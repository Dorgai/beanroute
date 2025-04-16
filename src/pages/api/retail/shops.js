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
      console.log('Session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Allow roaster users to view shops for order status management
    // No need to block roasters anymore as they can view and manage orders

    console.log('Fetching shops for retail orders');

    // Get all shops
    let shops;
    try {
      shops = await prisma.shop.findMany({
        orderBy: {
          name: 'asc'
        }
      });
      console.log(`Found ${shops.length} shops`);
    } catch (dbError) {
      console.error('Database error fetching shops:', dbError);
      return res.status(500).json({ 
        error: 'Database error fetching shops',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!shops || !Array.isArray(shops)) {
      console.log('Invalid shops data, returning empty array');
      return res.status(200).json([]);
    }

    return res.status(200).json(shops);
  } catch (error) {
    console.error('Unhandled error in shops API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch shops',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 