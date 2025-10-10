// Unsubscribe user from push notifications
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

    const { endpoint } = req.body;

    // Unsubscribe the user
    await pushNotificationService.unsubscribeUser(session.user.id, endpoint);

    console.log(`[Push API] User ${session.user.username} unsubscribed from push notifications`);

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });

  } catch (error) {
    console.error('[Push API] Error unsubscribing user:', error);
    return res.status(500).json({ 
      error: 'Failed to unsubscribe from push notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}



