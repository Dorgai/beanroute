// Notification Templates for Different Event Types
// Provides consistent messaging and smart targeting for push notifications

export const NotificationTemplates = {
  /**
   * Order-related notification templates
   */
  ORDER: {
    // New order created
    NEW_ORDER: {
      title: (data) => `New Order #${data.orderNumber || 'N/A'}`,
      body: (data) => `${data.shopName} placed a new order${data.itemCount ? ` with ${data.itemCount} items` : ''}`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `order-new-${data.orderId}`,
      data: (data) => ({
        type: 'ORDER',
        orderId: data.orderId,
        shopId: data.shopId,
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'ROASTER'],
      requireInteraction: true
    },

    // Order status changed
    STATUS_CHANGE: {
      title: (data) => `Order ${data.newStatus}`,
      body: (data) => `Order #${data.orderNumber || 'N/A'} for ${data.shopName} is now ${data.newStatus.toLowerCase()}`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `order-status-${data.orderId}`,
      data: (data) => ({
        type: 'ORDER',
        orderId: data.orderId,
        shopId: data.shopId,
        status: data.newStatus,
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/icons/icon-72x72.png'
        }
      ],
      // Target shop users for their orders + admins/owners
      targetRoles: (data) => {
        const roles = ['ADMIN', 'OWNER'];
        if (data.shopId) {
          roles.push('RETAILER'); // Shop-specific targeting
        }
        return roles;
      },
      requireInteraction: false
    },

    // Order delivered - confirmation request
    DELIVERED: {
      title: (data) => `Order Delivered`,
      body: (data) => `Order #${data.orderNumber || 'N/A'} has been delivered to ${data.shopName}. Please confirm receipt.`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `order-delivered-${data.orderId}`,
      data: (data) => ({
        type: 'ORDER',
        orderId: data.orderId,
        shopId: data.shopId,
        action: 'confirm'
      }),
      actions: [
        {
          action: 'confirm',
          title: 'Confirm Receipt',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'view',
          title: 'View Details'
        }
      ],
      targetRoles: (data) => data.shopId ? ['RETAILER'] : ['ADMIN', 'OWNER'],
      requireInteraction: true
    }
  },

  /**
   * Inventory-related notification templates
   */
  INVENTORY: {
    // Low stock warning
    LOW_STOCK: {
      title: (data) => `Low Stock Alert`,
      body: (data) => `${data.shopName || 'A shop'} is running low on coffee inventory (${data.percentage}% remaining)`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `inventory-low-${data.shopId}`,
      data: (data) => ({
        type: 'INVENTORY',
        shopId: data.shopId,
        alertType: 'LOW_STOCK',
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'Check Inventory',
          icon: '/icons/icon-72x72.png'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'ROASTER'],
      requireInteraction: false
    },

    // Critical stock alert
    CRITICAL_STOCK: {
      title: (data) => `🚨 Critical Stock Alert`,
      body: (data) => `${data.shopName || 'A shop'} has critically low inventory (${data.percentage}% remaining)! Immediate action required.`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `inventory-critical-${data.shopId}`,
      data: (data) => ({
        type: 'INVENTORY',
        shopId: data.shopId,
        alertType: 'CRITICAL_STOCK',
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'Check Now',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'order',
          title: 'Create Order'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'ROASTER'],
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    },

    // New coffee inventory added
    NEW_INVENTORY: {
      title: (data) => `New Coffee Inventory`,
      body: (data) => `${data.coffeeName} inventory updated${data.quantity ? ` (+${data.quantity}kg)` : ''}`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `inventory-new-${data.coffeeId}`,
      data: (data) => ({
        type: 'INVENTORY',
        coffeeId: data.coffeeId,
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Coffee',
          icon: '/icons/icon-72x72.png'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'RETAILER', 'ROASTER'],
      requireInteraction: false
    }
  },

  /**
   * Message-related notification templates
   */
  MESSAGE: {
    // New message posted
    NEW_MESSAGE: {
      title: (data) => `New Message`,
      body: (data) => `${data.senderName}: ${data.messagePreview}`,
      icon: '/icons/icon-192x192.png',
      tag: 'message-new',
      data: (data) => ({
        type: 'MESSAGE',
        messageId: data.messageId,
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Message',
          icon: '/icons/icon-72x72.png'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'RETAILER', 'ROASTER', 'BARISTA'],
      requireInteraction: false
    },

    // User mentioned in message
    MENTION: {
      title: (data) => `You were mentioned`,
      body: (data) => `${data.senderName} mentioned you: ${data.messagePreview}`,
      icon: '/icons/icon-192x192.png',
      tag: (data) => `message-mention-${data.messageId}`,
      data: (data) => ({
        type: 'MESSAGE',
        messageId: data.messageId,
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Message',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'reply',
          title: 'Reply'
        }
      ],
      targetRoles: [], // Specific user targeting
      requireInteraction: true
    },

    // System announcement
    ANNOUNCEMENT: {
      title: (data) => `📢 System Announcement`,
      body: (data) => data.announcement,
      icon: '/icons/icon-192x192.png',
      tag: 'system-announcement',
      data: (data) => ({
        type: 'MESSAGE',
        action: 'view'
      }),
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/icon-72x72.png'
        }
      ],
      targetRoles: ['ADMIN', 'OWNER', 'RETAILER', 'ROASTER', 'BARISTA'],
      requireInteraction: true
    }
  },

  /**
   * System-related notification templates
   */
  SYSTEM: {
    // System maintenance
    MAINTENANCE: {
      title: (data) => `System Maintenance`,
      body: (data) => data.message || 'Scheduled maintenance will begin shortly',
      icon: '/icons/icon-192x192.png',
      tag: 'system-maintenance',
      data: (data) => ({
        type: 'SYSTEM',
        action: 'view'
      }),
      targetRoles: ['ADMIN', 'OWNER', 'RETAILER', 'ROASTER', 'BARISTA'],
      requireInteraction: true
    },

    // Welcome message for new users
    WELCOME: {
      title: (data) => `Welcome to BeanRoute!`,
      body: (data) => `Hello ${data.userName}! You're now receiving notifications for orders, inventory, and messages.`,
      icon: '/icons/icon-192x192.png',
      tag: 'welcome',
      data: (data) => ({
        type: 'SYSTEM',
        action: 'dismiss'
      }),
      actions: [
        {
          action: 'view',
          title: 'Get Started',
          icon: '/icons/icon-72x72.png'
        }
      ],
      targetRoles: [], // Specific user targeting
      requireInteraction: false
    }
  }
};

/**
 * Build notification object from template
 */
export const buildNotification = (templateCategory, templateType, data = {}) => {
  const template = NotificationTemplates[templateCategory]?.[templateType];
  
  if (!template) {
    throw new Error(`Notification template not found: ${templateCategory}.${templateType}`);
  }

  // Build notification object
  const notification = {
    title: typeof template.title === 'function' ? template.title(data) : template.title,
    body: typeof template.body === 'function' ? template.body(data) : template.body,
    icon: template.icon,
    tag: typeof template.tag === 'function' ? template.tag(data) : template.tag,
    data: typeof template.data === 'function' ? template.data(data) : template.data,
    actions: template.actions || [],
    requireInteraction: template.requireInteraction || false,
    silent: template.silent || false,
    vibrate: template.vibrate || [200, 100, 200],
    type: `${templateCategory}_${templateType}`
  };

  // Determine target roles
  let targetRoles = template.targetRoles;
  if (typeof targetRoles === 'function') {
    targetRoles = targetRoles(data);
  }

  return {
    notification,
    targetRoles: targetRoles || [],
    templateInfo: {
      category: templateCategory,
      type: templateType,
      data
    }
  };
};

/**
 * Get notification preview (for testing)
 */
export const getNotificationPreview = (templateCategory, templateType, sampleData = {}) => {
  try {
    const { notification } = buildNotification(templateCategory, templateType, sampleData);
    return {
      success: true,
      preview: {
        title: notification.title,
        body: notification.body,
        actions: notification.actions?.map(a => a.title) || []
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default NotificationTemplates;

