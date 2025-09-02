import pushNotificationService from '@/lib/push-notification-service';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res);
    if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[test-status-push] Testing status change push notification...');

    // Test status change notification
    const result = await pushNotificationService.sendOrderStatusChangeNotification(
      'test-order-123',
      'PENDING',
      'CONFIRMED',
      {
        orderNumber: 'TEST123',
        shopId: 'test-shop',
        shopName: 'Test Shop',
        userId: session.user.id
      }
    );

    console.log('[test-status-push] Push notification result:', result);

    return res.status(200).json({
      success: true,
      message: 'Status change push notification test completed',
      result: result
    });

  } catch (error) {
    console.error('[test-status-push] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
