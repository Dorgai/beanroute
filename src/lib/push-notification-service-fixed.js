// Fixed Push Notification Service for current database schema
// This version works with the basic PushSubscription table we created

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import { buildNotification } from './notification-templates.js';

class PushNotificationService {
  constructor() {
    // Configure VAPID keys for authentication
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@beanroute.com'
    };
    
    // Configure web-push library
    if (this.vapidKeys.publicKey && this.vapidKeys.privateKey) {
      webpush.setVapidDetails(
        this.vapidKeys.subject,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );
      console.log('[Push] VAPID keys configured successfully');
    } else {
      console.warn('[Push] VAPID keys not configured - push notifications disabled');
    }
  }

  /**
   * Check if push notifications are properly configured
   */
  isConfigured() {
    return !!(this.vapidKeys.publicKey && this.vapidKeys.privateKey);
  }

  /**
   * Get the public VAPID key for client-side subscription
   */
  getPublicKey() {
    return this.vapidKeys.publicKey;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribeUser(userId, subscription, userAgent = null) {
    if (!this.isConfigured()) {
      throw new Error('Push notifications not configured');
    }

    const prisma = new PrismaClient();
    
    try {
      // Create or update subscription using basic schema
      const pushSubscription = await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date()
        },
        create: {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });

      console.log(`[Push] User ${userId} subscribed successfully`);
      return pushSubscription;
    } catch (error) {
      console.error('[Push] Error subscribing user:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribeUser(userId, endpoint = null) {
    const prisma = new PrismaClient();
    
    try {
      if (endpoint) {
        // Unsubscribe specific endpoint
        await prisma.pushSubscription.deleteMany({
          where: { userId, endpoint }
        });
      } else {
        // Unsubscribe all user's devices
        await prisma.pushSubscription.deleteMany({
          where: { userId }
        });
      }

      console.log(`[Push] User ${userId} unsubscribed successfully`);
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing user:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send a push notification to a specific user
   */
  async sendNotificationToUser(userId, notification) {
    const prisma = new PrismaClient();
    
    try {
      // Get user's active subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      if (subscriptions.length === 0) {
        console.log(`[Push] No subscriptions found for user ${userId}`);
        return { sent: 0, total: 0 };
      }

      let sentCount = 0;
      const errors = [];

      // Send to all user's devices
      for (const subscription of subscriptions) {
        try {
          const payload = JSON.stringify(notification);
          
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            payload
          );

          sentCount++;
          console.log(`[Push] Notification sent to user ${userId} device ${subscription.id}`);
        } catch (error) {
          console.error(`[Push] Failed to send to device ${subscription.id}:`, error);
          errors.push({ deviceId: subscription.id, error: error.message });
          
          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            });
            console.log(`[Push] Removed invalid subscription ${subscription.id}`);
          }
        }
      }

      return {
        sent: sentCount,
        total: subscriptions.length,
        errors
      };
    } catch (error) {
      console.error('[Push] Error sending notification to user:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send a push notification to all subscribed users
   */
  async sendNotificationToAll(notification) {
    const prisma = new PrismaClient();
    
    try {
      // Get all active subscriptions
      const subscriptions = await prisma.pushSubscription.findMany();

      if (subscriptions.length === 0) {
        console.log('[Push] No subscriptions found');
        return { sent: 0, total: 0 };
      }

      let sentCount = 0;
      const errors = [];

      // Send to all devices
      for (const subscription of subscriptions) {
        try {
          const payload = JSON.stringify(notification);
          
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            },
            payload
          );

          sentCount++;
        } catch (error) {
          console.error(`[Push] Failed to send to device ${subscription.id}:`, error);
          errors.push({ deviceId: subscription.id, error: error.message });
          
          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            });
          }
        }
      }

      return {
        sent: sentCount,
        total: subscriptions.length,
        errors
      };
    } catch (error) {
      console.error('[Push] Error sending notification to all:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new PushNotificationService();
