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
    // Basic validation
    if (!userId || !action) {
      console.error('Missing required fields for activity logging');
      return null;
    }

    // Create a base data object with the required fields
    const activityData = {
      userId,
      action,
      details: details || ''
    };

    // Only add resource fields if they exist in the schema (to handle older DB versions)
    try {
      // Attempt to check if the UserActivity model has the resource field
      // by querying with a limit of 0
      await prisma.userActivity.findMany({
        where: { resource: { not: null } },
        take: 0
      });
      
      // If the code reaches here, it means the resource field exists
      if (resource) activityData.resource = resource;
      if (resourceId) activityData.resourceId = resourceId;
    } catch (err) {
      // The resource field doesn't exist in the schema
      // We'll continue without adding those fields
      console.warn('Resource field not found in UserActivity schema, continuing without it');
    }

    // Create the activity log
    return await prisma.userActivity.create({
      data: activityData
    });
  } catch (error) {
    // Log errors but don't fail the main operation
    console.error('Failed to log user activity:', error);
    return null;
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
  
  // Build where clause for filters that definitely exist
  const where = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (action) {
    where.action = action;
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
  
  // Determine if resource field exists by checking metadata
  let hasResourceField = false;

  try {
    // Create a query to check if the resource field exists
    await prisma.userActivity.findFirst({
      select: { resource: true },
      take: 0
    });
    
    // If we get here, the resource field exists
    hasResourceField = true;
    
    // Add resource filter if the field exists and a value was provided
    if (resource && hasResourceField) {
      where.resource = resource;
    }
  } catch (error) {
    // Resource field doesn't exist, we'll ignore it
    console.info('Resource field not available in UserActivity model');
  }
  
  // Get total count for pagination
  const totalCount = await prisma.userActivity.count({ where });
  
  // Define the select fields based on available columns
  const selectFields = {
    user: {
      select: {
        id: true,
        username: true,
        email: true
      }
    }
  };
  
  // Get activities
  const activities = await prisma.userActivity.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    include: selectFields,
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