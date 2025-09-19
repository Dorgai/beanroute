// Debug mobile push notifications
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prisma = new PrismaClient();
    
    // Get all active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { isActive: true },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        createdAt: true,
        lastUsed: true
      }
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: `Found ${subscriptions.length} active subscriptions`,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed
      }))
    });

  } catch (error) {
    console.error('[Debug Mobile] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to debug mobile push notifications',
      details: error.message
    });
  }
}


