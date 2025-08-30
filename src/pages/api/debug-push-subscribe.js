// Debug endpoint for push subscription
// This will help us see exactly what's failing

import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[DEBUG] Push subscription request received');
    
    // Step 1: Check session
    console.log('[DEBUG] Step 1: Checking session...');
    const session = await getServerSession(req, res);
    console.log('[DEBUG] Session result:', session ? 'Found' : 'Not found');
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - No session' });
    }

    console.log('[DEBUG] User ID:', session.user.id);
    console.log('[DEBUG] Username:', session.user.username);

    // Step 2: Check request body
    console.log('[DEBUG] Step 2: Checking request body...');
    const { subscription, userAgent } = req.body;
    console.log('[DEBUG] Request body keys:', Object.keys(req.body));
    
    if (!subscription) {
      return res.status(400).json({ error: 'No subscription object' });
    }

    // Step 3: Validate subscription
    console.log('[DEBUG] Step 3: Validating subscription...');
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        error: 'Invalid subscription object',
        received: { endpoint: !!subscription.endpoint, keys: !!subscription.keys }
      });
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ 
        error: 'Invalid subscription keys',
        received: { p256dh: !!subscription.keys.p256dh, auth: !!subscription.keys.auth }
      });
    }

    console.log('[DEBUG] Subscription validation passed');

    // Step 4: Check environment variables
    console.log('[DEBUG] Step 4: Checking environment variables...');
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;
    
    console.log('[DEBUG] VAPID_PUBLIC_KEY:', vapidPublic ? 'Set' : 'Not set');
    console.log('[DEBUG] VAPID_PRIVATE_KEY:', vapidPrivate ? 'Set' : 'Not set');
    console.log('[DEBUG] VAPID_SUBJECT:', vapidSubject || 'Not set');

    if (!vapidPublic || !vapidPrivate) {
      return res.status(503).json({ 
        error: 'Push notifications not configured',
        missing: {
          publicKey: !vapidPublic,
          privateKey: !vapidPrivate
        }
      });
    }

    // Step 5: Try to import push notification service
    console.log('[DEBUG] Step 5: Importing push notification service...');
    let pushNotificationService;
    try {
      pushNotificationService = await import('@/lib/push-notification-service');
      console.log('[DEBUG] Push notification service imported successfully');
    } catch (importError) {
      console.error('[DEBUG] Import error:', importError);
      return res.status(500).json({ 
        error: 'Failed to import push notification service',
        details: importError.message
      });
    }

    // Step 6: Check if service is configured
    console.log('[DEBUG] Step 6: Checking service configuration...');
    if (!pushNotificationService.default.isConfigured()) {
      return res.status(503).json({ 
        error: 'Push notification service not configured',
        message: 'Service isConfigured() returned false'
      });
    }

    console.log('[DEBUG] Service is configured');

    // Step 7: Try to subscribe user
    console.log('[DEBUG] Step 7: Attempting to subscribe user...');
    try {
      const result = await pushNotificationService.default.subscribeUser(
        session.user.id,
        subscription,
        userAgent
      );
      
      console.log('[DEBUG] Subscription successful:', result);
      
      return res.status(200).json({
        success: true,
        message: 'Successfully subscribed to push notifications',
        subscriptionId: result.id,
        debug: {
          stepsCompleted: 7,
          userId: session.user.id,
          endpoint: subscription.endpoint
        }
      });
      
    } catch (subscribeError) {
      console.error('[DEBUG] Subscription error:', subscribeError);
      return res.status(500).json({ 
        error: 'Failed to subscribe user',
        details: subscribeError.message,
        stack: subscribeError.stack
      });
    }

  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error in debug endpoint',
      details: error.message,
      stack: error.stack
    });
  }
}
