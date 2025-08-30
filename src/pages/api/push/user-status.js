// Get current user's push notification subscription status
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Get user's current subscription
    const subscription = await pushNotificationService.getUserSubscription(session.user.id);

    return res.status(200).json({
      success: true,
      subscribed: !!subscription,
      subscription: subscription ? {
        id: subscription.id,
        endpoint: subscription.endpoint,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      } : null
    });

  } catch (error) {
    console.error('[Push API] Error getting user status:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
