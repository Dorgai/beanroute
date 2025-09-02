// Simple push notification test endpoint
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can test notifications
    if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log(`[Push Test] Testing simple notification for user: ${session.user.id}`);

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Send a simple test notification
    const result = await pushNotificationService.sendNotificationToUser(
      session.user.id,
      {
        title: '🧪 Test Notification',
        body: 'This is a test push notification from BeanRoute!',
        icon: '/images/logo-192.png',
        badge: '/images/badge-72.png',
        tag: 'test-notification',
        data: {
          type: 'TEST',
          timestamp: new Date().toISOString(),
          userId: session.user.id
        }
      }
    );

    console.log(`[Push Test] Test result:`, result);

    return res.status(200).json({
      success: result.sent > 0,
      message: result.sent > 0 
        ? `Test notification sent successfully to ${result.sent}/${result.total} devices`
        : `Test notification failed - no active subscriptions found`,
      details: {
        sent: result.sent,
        total: result.total,
        errors: result.errors || []
      }
    });

  } catch (error) {
    console.error('[Push Test] Error testing push notification:', error);
    return res.status(500).json({ 
      error: 'Failed to test push notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
