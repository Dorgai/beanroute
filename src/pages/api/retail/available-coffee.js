// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();

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

    // We are now allowing roaster users to view coffee availability
    // Roasters need access to see what coffee is available for orders

    console.log('Fetching available coffee');

    // Get all available green coffee with quantity > 0
    let coffee;
    try {
      coffee = await prisma.greenCoffee.findMany({
        where: {
          quantity: {
            gt: 0
          }
        },
        orderBy: [
          {
            grade: 'asc'
          },
          {
            name: 'asc'
          }
        ]
      });
      console.log(`Found ${coffee.length} available coffee items`);
    } catch (dbError) {
      console.error('Database error fetching available coffee:', dbError);
      return res.status(500).json({ 
        error: 'Database error fetching available coffee',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    } finally {
      // Always disconnect to prevent connection pool issues
      await prisma.$disconnect();
    }

    if (!coffee || !Array.isArray(coffee)) {
      console.log('Invalid coffee data, returning empty result');
      return res.status(200).json({});
    }

    return res.status(200).json(coffee);
  } catch (error) {
    console.error('Unhandled error in available coffee API:', error);
    // Make sure to disconnect prisma in case of errors too
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch available coffee',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 