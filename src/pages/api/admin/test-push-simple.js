// Simple push notification test
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res);
    if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[Push Simple Test] Testing for user: ${session.user.id}`);

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Check if user has subscriptions
    const prisma = new PrismaClient();
    let userSubscriptions = [];
    
    try {
      userSubscriptions = await prisma.pushSubscription.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          endpoint: true,
          isActive: true
        }
      });
      console.log(`[Push Simple Test] User has ${userSubscriptions.length} subscriptions`);
    } catch (dbError) {
      console.error('[Push Simple Test] Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        details: dbError.message
      });
    } finally {
      await prisma.$disconnect();
    }

    if (userSubscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'No subscriptions found',
        message: 'User has no active push notification subscriptions'
      });
    }

    // Try to send a simple notification
    console.log('[Push Simple Test] Attempting to send notification...');
    
    const result = await pushNotificationService.sendNotificationToUser(
      session.user.id,
      {
        title: '🧪 Simple Test',
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'simple-test',
        data: {
          type: 'SIMPLE_TEST',
          timestamp: Date.now(),
          userId: session.user.id
        }
      }
    );

    console.log('[Push Simple Test] Result:', result);

    return res.status(200).json({
      success: result.sent > 0,
      message: result.sent > 0 
        ? `Test notification sent successfully to ${result.sent}/${result.total} devices`
        : `Test notification failed - no devices received it`,
      details: {
        sent: result.sent,
        total: result.total,
        errors: result.errors || [],
        userSubscriptions: userSubscriptions.length
      }
    });

  } catch (error) {
    console.error('[Push Simple Test] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to send test notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
