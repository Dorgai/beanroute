import prisma from './prisma';

/**
 * Log a user activity
 * @param {object} data Activity data
 * @param {string} data.userId ID of the user performing the action
 * @param {string} data.action Type of action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
 * @param {string} data.resource Type of resource affected (USER, SHOP, COFFEE, etc.)
 * @param {string} data.resourceId ID of the resource affected (can be null)
 * @param {string} data.details Additional details about the action
 */
export async function logActivity({ userId, action, resource, resourceId = null, details = '' }) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details
      }
    });
  } catch (error) {
    // Log errors but don't fail the main operation
    console.error('Failed to log user activity:', error);
  }
}

/**
 * Get user activity logs with pagination and filtering
 */
export async function getActivityLogs({ 
  page = 1, 
  limit = 20, 
  userId = null,
  action = null,
  resource = null,
  fromDate = null,
  toDate = null
}) {
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (action) {
    where.action = action;
  }
  
  if (resource) {
    where.resource = resource;
  }
  
  // Date filtering
  if (fromDate || toDate) {
    where.createdAt = {};
    
    if (fromDate) {
      where.createdAt.gte = new Date(fromDate);
    }
    
    if (toDate) {
      where.createdAt.lte = new Date(toDate);
    }
  }
  
  // Get total count for pagination
  const totalCount = await prisma.userActivity.count({ where });
  
  // Get activities
  const activities = await prisma.userActivity.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    skip,
    take: limit
  });
  
  return {
    activities,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Get recent activities for a specific user
 */
export async function getUserRecentActivities(userId, limit = 5) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  return prisma.userActivity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get activity summary counts
 */
export async function getActivitySummary(days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  // Count activities by type in the last X days
  const activityCounts = await prisma.userActivity.groupBy({
    by: ['action'],
    _count: { id: true },
    where: {
      createdAt: {
        gte: fromDate
      }
    }
  });
  
  // Count activities by user in the last X days
  const userCounts = await prisma.userActivity.groupBy({
    by: ['userId'],
    _count: { id: true },
    where: {
      createdAt: {
        gte: fromDate
      }
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  });
  
  // Get user details for the top users
  const userIds = userCounts.map(count => count.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      username: true,
      email: true
    }
  });
  
  // Combine user details with activity counts
  const topUsers = userCounts.map(count => {
    const user = users.find(u => u.id === count.userId);
    return {
      user,
      activityCount: count._count.id
    };
  });
  
  return {
    activityCounts: activityCounts.map(count => ({
      action: count.action,
      count: count._count.id
    })),
    topUsers,
    periodDays: days
  };
} 