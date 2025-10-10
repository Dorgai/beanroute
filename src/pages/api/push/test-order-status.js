// Test order status change notification endpoint
import pushNotificationService from '@/lib/push-notification-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Test Order Status] Testing order status change notification...');

    // Test data
    const testData = {
      orderId: 'test-order-' + Date.now(),
      oldStatus: 'PENDING',
      newStatus: 'CONFIRMED',
      orderNumber: '12345678',
      shopId: 'test-shop-456',
      shopName: 'Test Shop',
      userId: '01d387b2-5fa2-4de5-bc82-c26104cc96f5' // Your user ID
    };

    console.log('[Test Order Status] Test data:', testData);

    const result = await pushNotificationService.sendOrderStatusChangeNotification(
      testData.orderId,
      testData.oldStatus,
      testData.newStatus,
      {
        orderNumber: testData.orderNumber,
        shopId: testData.shopId,
        shopName: testData.shopName,
        userId: testData.userId
      }
    );

    console.log('[Test Order Status] Result:', result);

    return res.status(200).json({
      success: result.success,
      message: result.success 
        ? 'Order status change notification sent successfully!'
        : 'Order status change notification failed',
      details: result,
      testData: testData
    });

  } catch (error) {
    console.error('[Test Order Status] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to test order status notification',
      details: error.message
    });
  }
}



