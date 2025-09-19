// Test API for integrated push notifications
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

    const { testType, targetUserId } = req.body;

    if (!testType) {
      return res.status(400).json({ 
        error: 'Test type is required',
        availableTypes: [
          'order_new',
          'order_status_change', 
          'order_delivered',
          'inventory_low_stock',
          'inventory_critical_stock',
          'message_new',
          'message_mention',
          'system_welcome'
        ]
      });
    }

    // Check if push notifications are configured
    if (!pushNotificationService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        message: 'VAPID keys are not set up on the server'
      });
    }

    let result;
    const targetUsers = targetUserId ? [targetUserId] : [session.user.id];

    console.log(`[Push Test] Testing ${testType} for user(s): ${targetUsers.join(', ')}`);

    switch (testType) {
      case 'order_new':
        result = await pushNotificationService.sendOrderNotification('NEW_ORDER', {
          orderId: 'test-order-123',
          orderNumber: 'TEST123',
          shopId: 'test-shop',
          shopName: 'Test Coffee Shop',
          itemCount: 3,
          createdBy: session.user.username
        });
        break;

      case 'order_status_change':
        result = await pushNotificationService.sendOrderNotification('STATUS_CHANGE', {
          orderId: 'test-order-123',
          orderNumber: 'TEST123',
          shopId: 'test-shop',
          shopName: 'Test Coffee Shop',
          oldStatus: 'PENDING',
          newStatus: 'CONFIRMED',
          updatedBy: session.user.username
        });
        break;

      case 'order_delivered':
        result = await pushNotificationService.sendOrderNotification('DELIVERED', {
          orderId: 'test-order-123',
          orderNumber: 'TEST123',
          shopId: 'test-shop',
          shopName: 'Test Coffee Shop',
          updatedBy: session.user.username
        });
        break;

      case 'inventory_low_stock':
        result = await pushNotificationService.sendInventoryNotification('LOW_STOCK', {
          shopId: 'test-shop',
          shopName: 'Test Coffee Shop',
          percentage: '25.5',
          totalSmallBags: 15,
          totalLargeBags: 8,
          minSmallBags: 30,
          minLargeBags: 15
        });
        break;

      case 'inventory_critical_stock':
        result = await pushNotificationService.sendInventoryNotification('CRITICAL_STOCK', {
          shopId: 'test-shop',
          shopName: 'Test Coffee Shop',
          percentage: '8.2',
          totalSmallBags: 2,
          totalLargeBags: 1,
          minSmallBags: 30,
          minLargeBags: 15
        });
        break;

      case 'message_new':
        result = await pushNotificationService.sendMessageNotification('NEW_MESSAGE', {
          messageId: 'test-message-123',
          senderName: session.user.username,
          messagePreview: 'This is a test message to verify push notifications are working correctly!'
        }, targetUsers);
        break;

      case 'message_mention':
        result = await pushNotificationService.sendMessageNotification('MENTION', {
          messageId: 'test-message-123',
          senderName: session.user.username,
          messagePreview: `@${session.user.username} this is a test mention notification!`,
          mentionedUsername: session.user.username
        }, targetUsers);
        break;

      case 'system_welcome':
        result = await pushNotificationService.sendSystemNotification('WELCOME', {
          userName: session.user.username
        }, targetUsers);
        break;

      default:
        return res.status(400).json({ 
          error: `Unknown test type: ${testType}`,
          availableTypes: [
            'order_new',
            'order_status_change', 
            'order_delivered',
            'inventory_low_stock',
            'inventory_critical_stock',
            'message_new',
            'message_mention',
            'system_welcome'
          ]
        });
    }

    console.log(`[Push Test] ${testType} test result:`, result);

    return res.status(200).json({
      success: result.success,
      testType,
      message: result.success 
        ? `Test notification sent successfully to ${result.successful}/${result.total} recipients`
        : `Test notification failed: ${result.error}`,
      details: result,
      targetUsers
    });

  } catch (error) {
    console.error('[Push Test] Error testing push notification:', error);
    return res.status(500).json({ 
      error: 'Failed to test push notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


