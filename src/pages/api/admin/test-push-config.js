// Test push notification configuration
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';
import { PrismaClient } from '@prisma/client';

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

    console.log('[Push Config Test] Starting configuration check...');

    // Check VAPID configuration
    const isConfigured = pushNotificationService.isConfigured();
    const publicKey = pushNotificationService.getPublicKey();

    // Check database subscriptions
    const prisma = new PrismaClient();
    let subscriptionCount = 0;
    let activeSubscriptionCount = 0;

    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        select: {
          id: true,
          userId: true,
          isActive: true,
          createdAt: true
        }
      });

      subscriptionCount = subscriptions.length;
      activeSubscriptionCount = subscriptions.filter(sub => sub.isActive).length;

      console.log(`[Push Config Test] Found ${subscriptionCount} total subscriptions, ${activeSubscriptionCount} active`);
    } catch (dbError) {
      console.error('[Push Config Test] Database error:', dbError);
    } finally {
      await prisma.$disconnect();
    }

    // Check environment variables
    const envCheck = {
      hasVapidPublicKey: !!process.env.VAPID_PUBLIC_KEY,
      hasVapidPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
      hasVapidSubject: !!process.env.VAPID_SUBJECT,
      nodeEnv: process.env.NODE_ENV
    };

    console.log('[Push Config Test] Environment check:', envCheck);

    return res.status(200).json({
      success: true,
      configuration: {
        isConfigured,
        hasPublicKey: !!publicKey,
        publicKeyLength: publicKey ? publicKey.length : 0
      },
      database: {
        totalSubscriptions: subscriptionCount,
        activeSubscriptions: activeSubscriptionCount
      },
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Push Config Test] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to check push configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
