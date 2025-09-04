// Comprehensive push notification diagnostic tool
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

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

    console.log('[Push Diagnose] Starting comprehensive push notification diagnosis...');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: {
        id: session.user.id,
        role: session.user.role
      }
    };

    // 1. Check VAPID Configuration
    console.log('[Push Diagnose] Checking VAPID configuration...');
    const vapidConfig = {
      hasPublicKey: !!process.env.VAPID_PUBLIC_KEY,
      hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY,
      hasSubject: !!process.env.VAPID_SUBJECT,
      publicKeyLength: process.env.VAPID_PUBLIC_KEY ? process.env.VAPID_PUBLIC_KEY.length : 0,
      privateKeyLength: process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PRIVATE_KEY.length : 0,
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@beanroute.com'
    };

    diagnostics.vapid = vapidConfig;
    diagnostics.pushServiceConfigured = pushNotificationService.isConfigured();

    // 2. Check Database Schema
    console.log('[Push Diagnose] Checking database schema...');
    const prisma = new PrismaClient();
    let dbDiagnostics = {};

    try {
      // Check if PushSubscription table exists and get its structure
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'PushSubscription'
        ORDER BY ordinal_position;
      `;
      
      dbDiagnostics.tableExists = tableInfo.length > 0;
      dbDiagnostics.columns = tableInfo;

      // Check subscription count
      const subscriptionCount = await prisma.pushSubscription.count();
      const activeSubscriptionCount = await prisma.pushSubscription.count({
        where: { isActive: true }
      });

      dbDiagnostics.totalSubscriptions = subscriptionCount;
      dbDiagnostics.activeSubscriptions = activeSubscriptionCount;

      // Get user's subscriptions
      const userSubscriptions = await prisma.pushSubscription.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          endpoint: true,
          isActive: true,
          createdAt: true,
          lastUsed: true
        }
      });

      dbDiagnostics.userSubscriptions = userSubscriptions;

      console.log(`[Push Diagnose] Database check complete: ${subscriptionCount} total, ${activeSubscriptionCount} active, ${userSubscriptions.length} for user`);

    } catch (dbError) {
      console.error('[Push Diagnose] Database error:', dbError);
      dbDiagnostics.error = dbError.message;
    } finally {
      await prisma.$disconnect();
    }

    diagnostics.database = dbDiagnostics;

    // 3. Test web-push library
    console.log('[Push Diagnose] Testing web-push library...');
    let webPushTest = {};
    
    try {
      // Test VAPID configuration
      if (vapidConfig.hasPublicKey && vapidConfig.hasPrivateKey) {
        webpush.setVapidDetails(
          vapidConfig.subject,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        webPushTest.vapidConfigured = true;
      } else {
        webPushTest.vapidConfigured = false;
        webPushTest.error = 'Missing VAPID keys';
      }

      // Test if webpush is working
      webPushTest.libraryLoaded = typeof webpush.sendNotification === 'function';
      
    } catch (webPushError) {
      console.error('[Push Diagnose] Web-push error:', webPushError);
      webPushTest.error = webPushError.message;
    }

    diagnostics.webPush = webPushTest;

    // 4. Check service worker and client-side support
    console.log('[Push Diagnose] Checking client-side support...');
    const clientSupport = {
      note: 'Client-side checks would need to be done in browser console',
      recommendations: []
    };

    if (dbDiagnostics.userSubscriptions && dbDiagnostics.userSubscriptions.length === 0) {
      clientSupport.recommendations.push('No subscriptions found for current user - need to subscribe first');
    }

    if (!vapidConfig.hasPublicKey || !vapidConfig.hasPrivateKey) {
      clientSupport.recommendations.push('VAPID keys not configured - check environment variables');
    }

    if (!dbDiagnostics.tableExists) {
      clientSupport.recommendations.push('PushSubscription table does not exist - run database migrations');
    }

    diagnostics.clientSupport = clientSupport;

    // 5. Overall status
    const isFullyFunctional = 
      vapidConfig.hasPublicKey && 
      vapidConfig.hasPrivateKey && 
      dbDiagnostics.tableExists && 
      dbDiagnostics.activeSubscriptions > 0;

    diagnostics.overallStatus = {
      functional: isFullyFunctional,
      issues: clientSupport.recommendations,
      nextSteps: isFullyFunctional 
        ? ['Test sending a notification to verify end-to-end functionality']
        : ['Fix the issues listed above before testing notifications']
    };

    console.log('[Push Diagnose] Diagnosis complete:', diagnostics.overallStatus);

    return res.status(200).json(diagnostics);

  } catch (error) {
    console.error('[Push Diagnose] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to diagnose push notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
