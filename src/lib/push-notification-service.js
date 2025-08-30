// BeanRoute Push Notification Service
// Handles sending push notifications to subscribed users

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
      // Create or update subscription
      const pushSubscription = await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true,
          lastUsed: new Date()
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true
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
        await prisma.pushSubscription.updateMany({
          where: { userId, endpoint },
          data: { isActive: false }
        });
      } else {
        // Unsubscribe all user's devices
        await prisma.pushSubscription.updateMany({
          where: { userId },
          data: { isActive: false }
        });
      }

      console.log(`[Push] User ${userId} unsubscribed successfully`);
    } catch (error) {
      console.error('[Push] Error unsubscribing user:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendToUser(userId, notification) {
    if (!this.isConfigured()) {
      console.warn('[Push] Push notifications not configured, skipping');
      return { success: false, error: 'Not configured' };
    }

    const prisma = new PrismaClient();
    
    try {
      // Get user's active subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId, isActive: true }
      });

      if (subscriptions.length === 0) {
        console.log(`[Push] No active subscriptions for user ${userId}`);
        return { success: false, error: 'No subscriptions' };
      }

      // Send to all user's devices
      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendToSubscription(sub, notification))
      );

      // Log the notification
      await prisma.pushNotificationLog.create({
        data: {
          userId,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          notificationType: notification.type || 'GENERAL',
          success: results.some(r => r.status === 'fulfilled' && r.value.success)
        }
      });

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`[Push] Sent to ${successful}/${subscriptions.length} devices for user ${userId}`);

      return {
        success: successful > 0,
        total: subscriptions.length,
        successful,
        results
      };
    } catch (error) {
      console.error('[Push] Error sending to user:', error);
      return { success: false, error: error.message };
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds, notification) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, error: 'No users provided' };
    }

    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    return {
      success: successful > 0,
      total: userIds.length,
      successful,
      results
    };
  }

  /**
   * Send notification to all users with specific role
   */
  async sendToRole(role, notification) {
    if (!this.isConfigured()) {
      console.warn('[Push] Push notifications not configured, skipping');
      return { success: false, error: 'Not configured' };
    }

    const prisma = new PrismaClient();
    
    try {
      // Get users with specified role
      const users = await prisma.user.findMany({
        where: { role, status: 'ACTIVE' },
        select: { id: true }
      });

      const userIds = users.map(u => u.id);
      
      if (userIds.length === 0) {
        console.log(`[Push] No active users with role ${role}`);
        return { success: false, error: 'No users found' };
      }

      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('[Push] Error sending to role:', error);
      return { success: false, error: error.message };
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send notification to individual subscription
   */
  async sendToSubscription(subscription, notification) {
    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/icon-72x72.png',
        data: notification.data || {},
        actions: notification.actions || [],
        tag: notification.tag || 'default',
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false
      });

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      await webpush.sendNotification(pushSubscription, payload);
      
      // Update last used timestamp
      const prisma = new PrismaClient();
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastUsed: new Date() }
      });
      await prisma.$disconnect();

      return { success: true };
    } catch (error) {
      console.error('[Push] Error sending to subscription:', error);
      
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('[Push] Subscription expired, deactivating...');
        const prisma = new PrismaClient();
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false }
        });
        await prisma.$disconnect();
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up expired subscriptions
   */
  async cleanupExpiredSubscriptions() {
    const prisma = new PrismaClient();
    
    try {
      // Mark subscriptions as inactive if not used in 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.pushSubscription.updateMany({
        where: {
          lastUsed: { lt: thirtyDaysAgo },
          isActive: true
        },
        data: { isActive: false }
      });

      console.log(`[Push] Cleaned up ${result.count} expired subscriptions`);
      return result.count;
    } catch (error) {
      console.error('[Push] Error cleaning up subscriptions:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Get user's subscription status
   */
  async getUserSubscriptions(userId) {
    const prisma = new PrismaClient();
    
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          endpoint: true,
          userAgent: true,
          createdAt: true,
          lastUsed: true
        }
      });

      return subscriptions;
    } catch (error) {
      console.error('[Push] Error getting user subscriptions:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Send notification using template system
   */
  async sendTemplateNotification(templateCategory, templateType, data = {}, targetUsers = null) {
    if (!this.isConfigured()) {
      console.warn('[Push] Push notifications not configured, skipping template notification');
      return { success: false, error: 'Not configured' };
    }

    try {
      // Build notification from template
      const { notification, targetRoles } = buildNotification(templateCategory, templateType, data);
      
      console.log(`[Push] Sending template notification: ${templateCategory}.${templateType}`);

      let result;
      
      if (targetUsers && Array.isArray(targetUsers)) {
        // Send to specific users
        result = await this.sendToUsers(targetUsers, notification);
      } else if (targetRoles && targetRoles.length > 0) {
        // Send to users with specific roles
        const prisma = new PrismaClient();
        
        try {
          // Get shop-specific targeting if shopId is provided
          let whereClause = { 
            role: { in: targetRoles },
            status: 'ACTIVE'
          };

          // If shopId is provided and RETAILER is in target roles, filter by shop
          if (data.shopId && targetRoles.includes('RETAILER')) {
            const shopUsers = await prisma.userShop.findMany({
              where: { shopId: data.shopId },
              select: { userId: true }
            });
            
            const shopUserIds = shopUsers.map(us => us.userId);
            
            // For retailers, only target users from the specific shop
            if (targetRoles.length === 1 && targetRoles[0] === 'RETAILER') {
              whereClause = {
                id: { in: shopUserIds },
                role: 'RETAILER',
                status: 'ACTIVE'
              };
            } else {
              // For mixed roles, include shop retailers + other roles globally
              whereClause = {
                OR: [
                  {
                    id: { in: shopUserIds },
                    role: 'RETAILER',
                    status: 'ACTIVE'
                  },
                  {
                    role: { in: targetRoles.filter(r => r !== 'RETAILER') },
                    status: 'ACTIVE'
                  }
                ]
              };
            }
          }

          const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true }
          });

          const userIds = users.map(u => u.id);
          result = await this.sendToUsers(userIds, notification);
        } finally {
          await prisma.$disconnect();
        }
      } else {
        console.warn('[Push] No target users or roles specified for template notification');
        return { success: false, error: 'No targets specified' };
      }

      console.log(`[Push] Template notification sent: ${result.successful}/${result.total} recipients`);
      return result;

    } catch (error) {
      console.error(`[Push] Error sending template notification ${templateCategory}.${templateType}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order-related notifications
   */
  async sendOrderNotification(type, orderData) {
    return this.sendTemplateNotification('ORDER', type, orderData);
  }

  /**
   * Send inventory-related notifications  
   */
  async sendInventoryNotification(type, inventoryData) {
    return this.sendTemplateNotification('INVENTORY', type, inventoryData);
  }

  /**
   * Send message-related notifications
   */
  async sendMessageNotification(type, messageData, targetUsers = null) {
    return this.sendTemplateNotification('MESSAGE', type, messageData, targetUsers);
  }

  /**
   * Send system notifications
   */
  async sendSystemNotification(type, systemData, targetUsers = null) {
    return this.sendTemplateNotification('SYSTEM', type, systemData, targetUsers);
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
