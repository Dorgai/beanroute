// Subscribe user to push notifications
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

    const { subscription, userAgent, mobile, pwa } = req.body;

    // Standard validation for push subscriptions
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        error: 'Invalid subscription object',
        required: 'subscription.endpoint and subscription.keys are required'
      });
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ 
        error: 'Invalid subscription keys',
        required: 'subscription.keys.p256dh and subscription.keys.auth are required'
      });
    }

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Subscribe the user
    const result = await pushNotificationService.subscribeUser(
      session.user.id,
      subscription,
      userAgent,
      { mobile, pwa }
    );

    console.log(`[Push API] User ${session.user.username} subscribed to push notifications`);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscriptionId: result.id
    });

  } catch (error) {
    console.error('[Push API] Error subscribing user:', error);
    return res.status(500).json({ 
      error: 'Failed to subscribe to push notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

