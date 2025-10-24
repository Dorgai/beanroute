// Get user's push notification subscription status
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

    // Get user's subscriptions
    const subscriptions = await pushNotificationService.getUserSubscriptions(session.user.id);

    return res.status(200).json({
      configured: pushNotificationService.isConfigured(),
      subscribed: subscriptions.length > 0,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed
      }))
    });

  } catch (error) {
    console.error('[Push API] Error getting subscription status:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}





