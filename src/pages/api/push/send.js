// Send push notifications (Admin/System use)
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

    // Only admins and owners can send push notifications
    if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { 
      userIds, 
      role, 
      title, 
      body, 
      data, 
      type = 'ADMIN',
      icon,
      actions 
    } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'body']
      });
    }

    // Validate target (either userIds or role)
    if (!userIds && !role) {
      return res.status(400).json({ 
        error: 'Must specify either userIds or role',
        example: {
          userIds: ['user-id-1', 'user-id-2'],
          role: 'RETAILER'
        }
      });
    }

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    // Create notification object
    const notification = {
      title,
      body,
      data: data || {},
      type,
      icon: icon || '/icons/icon-192x192.png',
      actions: actions || []
    };

    let result;

    // Send to specific users or role
    if (userIds && Array.isArray(userIds)) {
      result = await pushNotificationService.sendToUsers(userIds, notification);
    } else if (role) {
      result = await pushNotificationService.sendToRole(role, notification);
    }

    console.log(`[Push API] Admin ${session.user.username} sent push notification:`, {
      title,
      target: userIds ? `${userIds.length} users` : `role ${role}`,
      success: result.success
    });

    return res.status(200).json({
      success: result.success,
      message: result.success 
        ? `Notification sent successfully to ${result.successful}/${result.total} recipients`
        : 'Failed to send notification',
      details: result
    });

  } catch (error) {
    console.error('[Push API] Error sending push notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send push notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


