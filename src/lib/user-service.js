import prisma from './prisma';
import { hashPassword } from './auth';
import { addUserToShop } from './shop-service';

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(page = 1, limit = 10, search = '', status = '', role = '', sortBy = 'username', sortOrder = 'asc') {
  const skip = (page - 1) * limit;

  // Build where clause based on filters
  const where = {
    // Add status filter if provided
    ...(status && { status }),
    // Add role filter if provided
    ...(role && { role }),
    // Add search filter if provided
    ...(search && {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  // Get users and total count in parallel for efficiency
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        // Include related data counts
        _count: {
          select: {
            teams: true,
            permissions: true,
            shops: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single user by ID with their related data
 */
export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
      permissions: true,
      shops: {
        include: {
          shop: true,
        },
      },
    },
  });
}

/**
 * Get a user by username
 */
export async function getUserByUsername(username) {
  return prisma.user.findUnique({
    where: { username },
  });
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Check if a user has permission to manage users
 * Only ADMIN and OWNER roles can manage users
 */
export function canManageUsers(userRole) {
  return userRole === 'ADMIN' || userRole === 'OWNER';
}

/**
 * Check if a user has permission to manage shops
 * All roles except ROASTER can manage shops
 */
export function canManageShops(userRole) {
  return userRole !== 'ROASTER';
}

/**
 * Create a new user
 */
export async function createUser(data, createdByUserId) {
  const { password, shopId, ...userData } = data;
  
  // Hash the password
  const hashedPassword = await hashPassword(password);
  
  // Create the user
  const createdUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
  
  // If shop ID is provided, assign the user to that shop
  if (shopId) {
    await addUserToShop(createdUser.id, shopId, userData.role || 'BARISTA');
  }
  
  return createdUser;
}

/**
 * Update an existing user
 */
export async function updateUser(id, data) {
  const { password, ...userData } = data;
  
  // If password is provided, hash it
  if (password) {
    userData.password = await hashPassword(password);
  }
  
  return prisma.user.update({
    where: { id },
    data: userData,
  });
}

/**
 * Update user status (activate/deactivate)
 */
export async function updateUserStatus(id, status) {
  return prisma.user.update({
    where: { id },
    data: { status },
  });
}

/**
 * Reset user password
 */
export async function resetUserPassword(id, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  
  return prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

/**
 * Delete a user
 */
export async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(id) {
  return prisma.user.update({
    where: { id },
    data: {
      lastLogin: new Date(),
    },
  });
}

/**
 * Get user activity with pagination
 */
export async function getUserActivity(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userActivity.count({ where: { userId } }),
  ]);
  
  return {
    activities,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}

/**
 * Get available user roles
 */
export function getUserRoles() {
  return [
    { id: 'ADMIN', name: 'Administrator' },
    { id: 'OWNER', name: 'Owner' },
    { id: 'RETAILER', name: 'Retailer' },
    { id: 'BARISTA', name: 'Barista' },
  ];
}

/**
 * Get available user statuses
 */
export function getUserStatuses() {
  return [
    { id: 'ACTIVE', name: 'Active' },
    { id: 'INACTIVE', name: 'Inactive' },
    { id: 'PENDING', name: 'Pending' },
    { id: 'LOCKED', name: 'Locked' },
  ];
}

export async function getUserPermissions(userId) {
  return prisma.permission.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      resource: true,
      action: true,
    },
  });
}

export async function assignUserToTeam(userId, teamId, role = 'MEMBER') {
  return prisma.userTeam.create({
    data: {
      userId,
      teamId,
      role,
    },
  });
}

export async function removeUserFromTeam(userId, teamId) {
  return prisma.userTeam.delete({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });
}

export async function getUserTeams(userId) {
  const userTeams = await prisma.userTeam.findMany({
    where: { userId },
    include: {
      team: true,
    },
  });
  
  return userTeams.map(ut => ({
    ...ut.team,
    role: ut.role,
  }));
}

export async function getUserActivities(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userActivity.count({ where: { userId } }),
  ]);
  
  return {
    activities,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
} 