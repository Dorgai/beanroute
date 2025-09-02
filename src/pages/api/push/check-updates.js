import { getServerSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const platform = req.headers['x-platform'] || 'unknown';

    console.log(`[Check Updates] Checking for updates for user ${userId} on platform ${platform}`);

    // Check for new orders or status changes
    const recentOrders = await prisma.retailOrder.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Check for inventory updates
    const recentInventoryUpdates = await prisma.retailInventory.findMany({
      where: {
        shop: {
          userId: userId
        },
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        coffeeName: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // Check for new notifications
    const recentNotifications = await prisma.orderEmailNotification.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        type: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Determine if there are new updates
    const hasNewOrders = recentOrders.length > 0;
    const hasNewInventory = recentInventoryUpdates.length > 0;
    const hasNewNotifications = recentNotifications.length > 0;
    const hasNewUpdates = hasNewOrders || hasNewInventory || hasNewNotifications;

    // For iOS PWA, provide more detailed information
    if (platform === 'ios-pwa') {
      const iosSpecificData = {
        hasNewUpdates,
        hasNewOrders,
        hasNewInventory,
        hasNewNotifications,
        orders: hasNewOrders ? recentOrders : [],
        inventory: hasNewInventory ? recentInventoryUpdates : [],
        notifications: hasNewNotifications ? recentNotifications : [],
        lastCheck: new Date().toISOString(),
        platform: 'ios-pwa',
        // iOS-specific notification suggestions
        notificationTitle: hasNewUpdates ? 'BeanRoute Updates Available' : 'No New Updates',
        notificationBody: hasNewUpdates 
          ? `You have ${recentOrders.length} new orders, ${recentInventoryUpdates.length} inventory updates, and ${recentNotifications.length} notifications`
          : 'All caught up!'
      };

      console.log(`[Check Updates] iOS PWA update check result:`, iosSpecificData);
      return res.status(200).json(iosSpecificData);
    }

    // Standard response for other platforms
    const standardData = {
      hasNewUpdates,
      hasNewOrders,
      hasNewInventory,
      hasNewNotifications,
      lastCheck: new Date().toISOString(),
      platform: 'standard'
    };

    console.log(`[Check Updates] Standard update check result:`, standardData);
    return res.status(200).json(standardData);

  } catch (error) {
    console.error('[Check Updates] Error checking for updates:', error);
    return res.status(500).json({ 
      error: 'Failed to check for updates',
      hasNewUpdates: false 
    });
  } finally {
    await prisma.$disconnect();
  }
}
