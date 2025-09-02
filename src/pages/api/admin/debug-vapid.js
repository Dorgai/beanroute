import pushNotificationService from '@/lib/push-notification-service';
import { getServerSession } from '@/lib/session';

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

    console.log('[debug-vapid] Checking VAPID configuration...');

    const isConfigured = pushNotificationService.isConfigured();
    const publicKey = pushNotificationService.getPublicKey();

    return res.status(200).json({
      success: true,
      vapidConfigured: isConfigured,
      publicKeyExists: !!publicKey,
      publicKeyLength: publicKey ? publicKey.length : 0,
      publicKeyPreview: publicKey ? publicKey.substring(0, 20) + '...' : 'Not set',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VAPID_PUBLIC_KEY_SET: !!process.env.VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY_SET: !!process.env.VAPID_PRIVATE_KEY,
        VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'Not set'
      }
    });

  } catch (error) {
    console.error('[debug-vapid] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
