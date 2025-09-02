import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res);
    if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[debug-push-subscriptions] Fetching push subscriptions...');

    // Get all push subscriptions (select only essential fields to avoid schema issues)
    const subscriptions = await prisma.pushSubscription.findMany({
      select: {
        id: true,
        userId: true,
        endpoint: true,
        isActive: true,
        createdAt: true,
        lastUsed: true,
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true
          }
        }
      }
    });

    console.log(`[debug-push-subscriptions] Found ${subscriptions.length} subscriptions`);

    const subscriptionSummary = subscriptions.map(sub => ({
      id: sub.id,
      userId: sub.userId,
      username: sub.user?.username || 'Unknown',
      role: sub.user?.role || 'Unknown',
      userStatus: sub.user?.status || 'Unknown',
      endpoint: sub.endpoint.substring(0, 50) + '...',
      isActive: sub.isActive,
      createdAt: sub.createdAt,
      lastUsed: sub.lastUsed
    }));

    return res.status(200).json({
      success: true,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.isActive).length,
      subscriptions: subscriptionSummary,
      roleBreakdown: {
        ADMIN: subscriptions.filter(s => s.user?.role === 'ADMIN').length,
        OWNER: subscriptions.filter(s => s.user?.role === 'OWNER').length,
        ROASTER: subscriptions.filter(s => s.user?.role === 'ROASTER').length,
        RETAILER: subscriptions.filter(s => s.user?.role === 'RETAILER').length,
        BARISTA: subscriptions.filter(s => s.user?.role === 'BARISTA').length
      }
    });

  } catch (error) {
    console.error('[debug-push-subscriptions] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
