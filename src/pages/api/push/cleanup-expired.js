// API endpoint to manually clean up expired push subscriptions
import { getServerSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[Push Cleanup] Cleaning expired subscriptions for user: ${session.user.id}`);

    // Remove all subscriptions for this user (they can re-subscribe)
    const deletedCount = await prisma.pushSubscription.deleteMany({
      where: { 
        userId: session.user.id 
      }
    });

    console.log(`[Push Cleanup] Removed ${deletedCount.count} subscriptions for user ${session.user.id}`);

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount.count} expired subscriptions. You can now re-enable push notifications.`,
      deletedCount: deletedCount.count
    });

  } catch (error) {
    console.error('[Push Cleanup] Error cleaning expired subscriptions:', error);
    return res.status(500).json({ 
      error: 'Failed to clean expired subscriptions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
