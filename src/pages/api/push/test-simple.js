// Simple push notification test endpoint - no authentication required for testing
import pushNotificationService from '@/lib/push-notification-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Push Test Simple] Testing push notification service...');

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Get all active subscriptions
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { isActive: true },
        select: {
          id: true,
          userId: true,
          endpoint: true,
          p256dh: true,
          auth: true
        }
      });

      console.log(`[Push Test Simple] Found ${subscriptions.length} active subscriptions`);

      if (subscriptions.length === 0) {
        await prisma.$disconnect();
        return res.status(200).json({
          success: false,
          message: 'No active push subscriptions found',
          details: {
            sent: 0,
            total: 0,
            subscriptions: []
          }
        });
      }

      // Send test notification to all subscriptions
      let sentCount = 0;
      const errors = [];

      for (const subscription of subscriptions) {
        try {
          const result = await pushNotificationService.sendNotificationToUser(
            subscription.userId,
            {
              title: '🧪 Test Notification',
              body: 'This is a test push notification from BeanRoute!',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: 'test-notification-simple',
              data: {
                type: 'TEST',
                timestamp: new Date().toISOString(),
                userId: subscription.userId
              }
            }
          );
          
          sentCount += result.sent;
          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors);
          }
        } catch (error) {
          console.error(`[Push Test Simple] Error sending to user ${subscription.userId}:`, error);
          errors.push({ userId: subscription.userId, error: error.message });
        }
      }

      await prisma.$disconnect();

      return res.status(200).json({
        success: sentCount > 0,
        message: sentCount > 0 
          ? `Test notification sent successfully to ${sentCount}/${subscriptions.length} devices`
          : `Test notification failed - no notifications were sent`,
        details: {
          sent: sentCount,
          total: subscriptions.length,
          errors: errors,
          subscriptions: subscriptions.map(s => ({ id: s.id, userId: s.userId }))
        }
      });

    } catch (dbError) {
      console.error('[Push Test Simple] Database error:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Database error',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('[Push Test Simple] Error testing push notification:', error);
    return res.status(500).json({ 
      error: 'Failed to test push notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}





