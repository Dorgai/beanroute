// Get push notification configuration (public VAPID key)
import pushNotificationService from '@/lib/push-notification-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(200).json({ 
        configured: false,
        message: 'Push notifications are not configured on this server'
      });
    }

    // Return public configuration
    return res.status(200).json({
      configured: true,
      publicKey: pushNotificationService.getPublicKey(),
      supported: true // This endpoint itself indicates server support
    });

  } catch (error) {
    console.error('[Push API] Error getting push config:', error);
    return res.status(500).json({ 
      error: 'Failed to get push notification configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}



