import prisma from './prisma';

/**
 * Get shops with pagination and filtering (basic)
 */
export async function getShops(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: { 
        createdBy: { select: { id: true, username: true } } // Include basic creator info
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
      createdBy: { select: { id: true, username: true } },
      users: { include: { user: { select: { id: true, username: true, role: true } } } } // Include associated users
    }
  });
}

/**
 * Create a new shop
 */
export async function createShop(data, createdById) {
  console.log('Creating shop with data:', { data, createdById });
  
  try {
    const { name, address, minCoffeeQuantityLarge, minCoffeeQuantitySmall } = data;
    
    // Validate inputs
    if (!name) {
      throw new Error('Shop name is required');
    }
    
    if (!createdById) {
      throw new Error('Creator ID is required');
    }
    
    // Ensure numbers are properly parsed
    const largeQty = parseInt(minCoffeeQuantityLarge, 10) || 0;
    const smallQty = parseInt(minCoffeeQuantitySmall, 10) || 0;
    
    console.log('Parsed shop quantities:', { largeQty, smallQty });
    
    const shop = await prisma.shop.create({
      data: {
        name,
        address,
        minCoffeeQuantityLarge: largeQty,
        minCoffeeQuantitySmall: smallQty,
        createdById: createdById,
      },
    });
    
    console.log('Shop created successfully:', shop.id);
    return shop;
  } catch (error) {
    console.error('Error in createShop service function:', error);
    throw error;
  }
}

/**
 * Update an existing shop
 */
export async function updateShop(id, data) {
   const { name, address, minCoffeeQuantityLarge, minCoffeeQuantitySmall } = data;
   return prisma.shop.update({
    where: { id },
    data: {
      name,
      address,
      minCoffeeQuantityLarge: parseInt(minCoffeeQuantityLarge, 10) || undefined, // Only update if provided
      minCoffeeQuantitySmall: parseInt(minCoffeeQuantitySmall, 10) || undefined,
      // Cannot change createdById
    },
  });
}

/**
 * Delete a shop
 */
export async function deleteShop(id) {
  // Consider relations: deleting a shop might need to handle UserShop relations
  // Depending on cascade settings in schema, this might be automatic or need manual steps
  return prisma.shop.delete({
    where: { id },
  });
}

/**
 * Add a user to a shop
 * (Moved here from user-service for better organization)
 */
export async function addUserToShop(userId, shopId, role = 'BARISTA') {
  return prisma.userShop.create({
    data: {
      userId,
      shopId,
      role, // Ensure this role matches the Role enum
    },
  });
}

/**
 * Remove a user from a shop
 */
export async function removeUserFromShop(userId, shopId) {
  return prisma.userShop.delete({
    where: {
      userId_shopId: { userId, shopId },
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

/**
 * Get users assigned to a specific shop with their details
 */
export async function getShopUsers(shopId) {
  const userShops = await prisma.userShop.findMany({
    where: { shopId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return userShops;
} 