import prisma from './prisma';

/**
 * Get all shops with pagination and filtering
 */
export async function getShops(page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc') {
  const skip = (page - 1) * limit;
  
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  return {
    shops,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single shop by ID
 */
export async function getShopById(id) {
  return prisma.shop.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Create a new shop
 */
export async function createShop(data, createdById) {
  return prisma.shop.create({
    data: {
      ...data,
      createdBy: {
        connect: { id: createdById },
      },
    },
  });
}

/**
 * Update an existing shop
 */
export async function updateShop(id, data) {
  return prisma.shop.update({
    where: { id },
    data,
  });
}

/**
 * Delete a shop
 */
export async function deleteShop(id) {
  return prisma.shop.delete({
    where: { id },
  });
}

/**
 * Add a user to a shop
 */
export async function addUserToShop(userId, shopId, role = 'BARISTA') {
  return prisma.userShop.create({
    data: {
      user: {
        connect: { id: userId },
      },
      shop: {
        connect: { id: shopId },
      },
      role,
    },
  });
}

/**
 * Remove a user from a shop
 */
export async function removeUserFromShop(userId, shopId) {
  return prisma.userShop.delete({
    where: {
      userId_shopId: {
        userId,
        shopId,
      },
    },
  });
}

/**
 * Update a user's role in a shop
 */
export async function updateUserRoleInShop(userId, shopId, role) {
  return prisma.userShop.update({
    where: {
      userId_shopId: {
        userId,
        shopId,
      },
    },
    data: { role },
  });
}

/**
 * Get shops for a specific user
 */
export async function getShopsForUser(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [shops, total] = await Promise.all([
    prisma.userShop.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        shop: {
          include: {
            _count: {
              select: { users: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userShop.count({ where: { userId } }),
  ]);

  return {
    shops: shops.map(us => ({
      ...us.shop,
      userRole: us.role,
    })),
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
} 