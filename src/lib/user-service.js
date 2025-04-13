import prisma from './prisma';
import { hashPassword } from './auth';

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });
}

export async function getUserByUsername(username) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUsers(filter = {}, page = 1, limit = 10) {
  const where = {};
  
  if (filter.role) {
    where.role = filter.role;
  }
  
  if (filter.status) {
    where.status = filter.status;
  }
  
  if (filter.search) {
    where.OR = [
      { username: { contains: filter.search, mode: 'insensitive' } },
      { email: { contains: filter.search, mode: 'insensitive' } },
      { firstName: { contains: filter.search, mode: 'insensitive' } },
      { lastName: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createUser(userData) {
  const { password, ...data } = userData;
  
  // Hash the password
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUser(id, userData) {
  const data = { ...userData };
  
  // If password is provided, hash it
  if (data.password) {
    data.password = await hashPassword(data.password);
  }
  
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });
}

export async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function updateLastLogin(id) {
  return prisma.user.update({
    where: { id },
    data: { 
      lastLogin: new Date(),
    },
  });
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