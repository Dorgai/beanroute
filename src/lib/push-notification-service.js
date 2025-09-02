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
  async subscribeUser(userId, subscription, userAgent = null, options = {}) {
    const prisma = new PrismaClient();
    
    try {
      // Handle mobile basic subscriptions (limited push support)
      const isMobileBasic = options.mobile && options.limited;
      
      if (isMobileBasic) {
        console.log(`[Push] Mobile basic subscription for user ${userId} - limited push support`);
        
        // For mobile basic subscriptions, we don't need VAPID keys
        // Just store the subscription for status tracking
      } else if (!this.isConfigured()) {
        throw new Error('Push notifications not configured');
      }

      // Check if user already has a subscription for this endpoint
      let existingSubscription;
      try {
        existingSubscription = await prisma.pushSubscription.findFirst({
          where: { 
            OR: [
              { endpoint: subscription.endpoint },
              { userId: userId }
            ]
          }
        });
      } catch (error) {
        console.error('[Push] Error checking existing subscription:', error);
        // If it's a column doesn't exist error, try a simpler query
        if (error.code === 'P2022') {
          try {
            console.log('[Push] Retrying existing subscription check with basic field selection...');
            existingSubscription = await prisma.pushSubscription.findFirst({
              where: { 
                OR: [
                  { endpoint: subscription.endpoint },
                  { userId: userId }
                ]
              },
              select: {
                id: true,
                userId: true,
                endpoint: true,
                p256dh: true,
                auth: true,
                isActive: true,
                createdAt: true,
                lastUsed: true
                // Omit mobile and limited fields that don't exist in production DB yet
              }
            });
          } catch (retryError) {
            console.error('[Push] Retry for existing subscription check also failed:', retryError);
            // If we can't check for existing subscriptions, continue with creating new one
            existingSubscription = null;
          }
        } else {
          throw error;
        }
      }

      if (existingSubscription) {
        if (existingSubscription.endpoint === subscription.endpoint) {
          // Update existing subscription (avoid missing columns)
          const updateData = {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            updatedAt: new Date()
            // Skip mobile and limited fields that don't exist in production DB yet
          };
          
          const updatedSubscription = await prisma.pushSubscription.update({
            where: { id: existingSubscription.id },
            data: updateData
          });
          console.log(`[Push] User ${userId} subscription updated successfully`);
          return updatedSubscription;
        } else {
          // User has subscription on different device, replace it
          await prisma.pushSubscription.deleteMany({
            where: { userId: userId }
          });
        }
      }

      // Create new subscription (avoid missing columns)
      const createData = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
        // Skip mobile and limited fields that don't exist in production DB yet
      };
      
      const pushSubscription = await prisma.pushSubscription.create({
        data: createData
      });

      console.log(`[Push] User ${userId} subscribed successfully (${isMobileBasic ? 'mobile basic' : 'full push'})`);
      return pushSubscription;
    } catch (error) {
      console.error('[Push] Error subscribing user:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId) {
    const prisma = new PrismaClient();
    
    try {
      // Try the full query first
      const subscription = await prisma.pushSubscription.findFirst({
        where: { userId }
      });
      return subscription;
    } catch (error) {
      console.error('[Push] Error getting user subscription:', error);
      // If it's a column doesn't exist error, try a simpler query with explicit field selection
      if (error.code === 'P2022') {
        try {
          console.log('[Push] Retrying with basic field selection due to missing columns...');
          const subscription = await prisma.pushSubscription.findFirst({
            where: { userId },
            select: {
              id: true,
              userId: true,
              endpoint: true,
              p256dh: true,
              auth: true,
              isActive: true,
              createdAt: true,
              lastUsed: true
              // Omit mobile and limited fields that don't exist in production DB yet
            }
          });
          return subscription;
        } catch (retryError) {
          console.error('[Push] Retry also failed:', retryError);
          throw retryError;
        }
      }
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
      // Get user's active subscriptions (select only essential fields to avoid schema issues)
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true,
          isActive: true
        }
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
          // Enhanced notification payload with mobile-specific options
          const enhancedNotification = {
            ...notification,
            // Mobile-specific enhancements
            badge: notification.badge || '/icons/icon-72x72.png',
            icon: notification.icon || '/icons/icon-192x192.png',
            // Ensure notifications work well in mobile notification centers
            requireInteraction: false,
            silent: false,
            // Mobile vibration patterns
            vibrate: [200, 100, 200, 100, 200],
            // Mobile-specific options
            dir: 'auto',
            lang: 'en',
            renotify: true,
            sticky: false,
            // Add timestamp for mobile notification centers
            timestamp: Date.now()
          };
          
          const payload = JSON.stringify(enhancedNotification);
          
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
            try {
              await prisma.pushSubscription.delete({
                where: { id: subscription.id }
              });
              console.log(`[Push] Removed expired subscription ${subscription.id} for user ${userId}`);
            } catch (deleteError) {
              console.error(`[Push] Error removing expired subscription ${subscription.id}:`, deleteError.message);
              // Don't throw - continue with other subscriptions
            }
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
   * Send a push notification to specific users
   */
  async sendToUsers(userIds, notification) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('userIds must be a non-empty array');
    }

    const results = [];
    let totalSuccessful = 0;
    let totalAttempted = 0;

    for (const userId of userIds) {
      try {
        const result = await this.sendNotificationToUser(userId, notification);
        results.push({ userId, success: true, result });
        totalSuccessful += result.sent;
        totalAttempted += result.total;
      } catch (error) {
        console.error(`[Push] Failed to send to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
        totalAttempted++;
      }
    }

    return {
      success: totalSuccessful > 0,
      successful: totalSuccessful,
      total: totalAttempted,
      results
    };
  }

  /**
   * Send a push notification to users with a specific role
   */
  async sendToRole(role, notification) {
    const prisma = new PrismaClient();
    
    try {
      // Get all users with the specified role
      const users = await prisma.user.findMany({
        where: { role, status: 'ACTIVE' },
        select: { id: true }
      });

      if (users.length === 0) {
        console.log(`[Push] No users found with role ${role}`);
        return { success: false, successful: 0, total: 0 };
      }

      const userIds = users.map(user => user.id);
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('[Push] Error sending notification to role:', error);
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
            try {
              await prisma.pushSubscription.delete({
                where: { id: subscription.id }
              });
              console.log(`[Push] Removed expired subscription ${subscription.id} for user ${userId}`);
            } catch (deleteError) {
              console.error(`[Push] Error removing expired subscription ${subscription.id}:`, deleteError.message);
              // Don't throw - continue with other subscriptions
            }
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

  /**
   * Send order-related push notifications
   */
  async sendOrderNotification(eventType, data) {
    if (!this.isConfigured()) {
      console.log('[Push] Push notifications not configured, skipping order notification');
      return { success: false, error: 'Push notifications not configured' };
    }

    try {
      let notification;
      let targetRoles = ['ADMIN', 'OWNER'];

      switch (eventType) {
        case 'NEW_ORDER':
          notification = {
            title: `New Order #${data.orderNumber || 'N/A'}`,
            body: `${data.shopName} placed a new order${data.itemCount ? ` with ${data.itemCount} items` : ''}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: `order-new-${data.orderId}`,
            data: {
              type: 'ORDER',
              orderId: data.orderId,
              shopId: data.shopId,
              action: 'view'
            },
            actions: [
              {
                action: 'view',
                title: 'View Order',
                icon: '/icons/icon-72x72.png'
              }
            ],
            requireInteraction: true,
            vibrate: [200, 100, 200]
          };
          targetRoles = ['ADMIN', 'OWNER', 'ROASTER'];
          break;

        case 'STATUS_CHANGE':
          notification = {
            title: `Order ${data.newStatus}`,
            body: `Order #${data.orderNumber || 'N/A'} for ${data.shopName} is now ${data.newStatus.toLowerCase()}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: `order-status-${data.orderId}`,
            data: {
              type: 'ORDER',
              orderId: data.orderId,
              shopId: data.shopId,
              status: data.newStatus,
              action: 'view'
            },
            actions: [
              {
                action: 'view',
                title: 'View Order',
                icon: '/icons/icon-72x72.png'
              }
            ],
            requireInteraction: false,
            vibrate: [100, 50, 100]
          };
          targetRoles = ['ADMIN', 'OWNER', 'RETAILER'];
          break;

        default:
          console.error(`[Push] Unknown order event type: ${eventType}`);
          return { success: false, error: `Unknown event type: ${eventType}` };
      }

      // Send to target roles
      let totalSent = 0;
      let totalRecipients = 0;
      const results = [];

      for (const role of targetRoles) {
        const result = await this.sendToRole(role, notification);
        totalSent += result.successful; // Fix: use 'successful' instead of 'sent'
        totalRecipients += result.total;
        results.push({ role, ...result });
      }

      console.log(`[Push] Order notification sent: ${totalSent}/${totalRecipients} recipients`);

      return {
        success: true,
        message: `Order notification sent to ${totalSent}/${totalRecipients} recipients`,
        successful: totalSent,
        total: totalRecipients,
        results
      };

    } catch (error) {
      console.error('[Push] Error sending order notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order status change notification
   */
  async sendOrderStatusChangeNotification(orderId, oldStatus, newStatus, data) {
    return this.sendOrderNotification('STATUS_CHANGE', {
      orderId,
      oldStatus,
      newStatus, // This is the key fix - making sure newStatus is passed correctly
      orderNumber: data.orderNumber || orderId.slice(-8),
      shopId: data.shopId,
      shopName: data.shopName || 'Shop',
      userId: data.userId
    });
  }
}

export default new PushNotificationService();
