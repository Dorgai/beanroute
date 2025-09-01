import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';
import { PrismaClient } from '@prisma/client';

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

    const { testType, orderId } = req.body;

    console.log(`[Debug Push] Starting push notification debug test: ${testType}`);

    // Check push notification configuration
    const isConfigured = pushNotificationService.isConfigured();
    console.log(`[Debug Push] Push service configured: ${isConfigured}`);

    if (!isConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Push notifications not configured',
        debug: {
          hasPublicKey: !!process.env.VAPID_PUBLIC_KEY,
          hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
          hasSubject: !!process.env.VAPID_SUBJECT
        }
      });
    }

    // Check subscriptions
    const prisma = new PrismaClient();
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    });

    console.log(`[Debug Push] Found ${subscriptions.length} subscriptions`);
    subscriptions.forEach(sub => {
      console.log(`[Debug Push] - User: ${sub.user.username} (${sub.user.role}), Active: ${sub.isActive}`);
    });

    let result;

    switch (testType) {
      case 'manual_test':
        // Send a manual test notification
        result = await pushNotificationService.sendNotificationToAll({
          title: 'Debug Test Notification',
          body: `Manual test sent at ${new Date().toLocaleTimeString()}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'debug-test',
          data: { type: 'DEBUG', timestamp: Date.now() },
          requireInteraction: false
        });
        break;

      case 'order_status_test':
        // Test order status change notification
        result = await pushNotificationService.sendOrderStatusChangeNotification(
          orderId || 'test-order-123',
          'PENDING',
          'CONFIRMED',
          {
            orderNumber: '12345',
            shopId: 'test-shop',
            shopName: 'Test Shop',
            userId: session.user.id
          }
        );
        break;

      case 'new_order_test':
        // Test new order notification
        result = await pushNotificationService.sendOrderNotification('NEW_ORDER', {
          orderId: orderId || 'test-order-123',
          orderNumber: '12345',
          shopId: 'test-shop',
          shopName: 'Test Shop',
          itemCount: 3,
          createdBy: session.user.username
        });
        break;

      default:
        return res.status(400).json({
          error: 'Invalid test type',
          availableTypes: ['manual_test', 'order_status_test', 'new_order_test']
        });
    }

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: `Push notification debug test completed: ${testType}`,
      result,
      debug: {
        isConfigured,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.isActive).length,
        userSubscriptions: subscriptions.map(s => ({
          userId: s.user.id,
          username: s.user.username,
          role: s.user.role,
          isActive: s.isActive,
          mobile: s.mobile
        })),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Debug Push] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
