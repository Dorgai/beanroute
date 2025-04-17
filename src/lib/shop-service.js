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

  try {
    console.log('Getting shops with pagination');
    
    // Try with only essential fields to avoid schema mismatches
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          address: true,
          minCoffeeQuantityLarge: true,
          minCoffeeQuantitySmall: true,
          createdAt: true,
          updatedAt: true,
          createdById: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.shop.count({ where }),
    ]);
    
    console.log(`Retrieved ${shops.length} shops`);
    
    // Get creator info separately to avoid schema issues
    const creatorIds = [...new Set(shops.map(shop => shop.createdById))];
    let creators = [];
    
    try {
      creators = await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, username: true }
      });
      console.log(`Retrieved ${creators.length} creators`);
    } catch (creatorError) {
      console.error('Error fetching shop creators:', creatorError);
    }
    
    // Map creator info to shops
    const shopsWithCreators = shops.map(shop => {
      const creator = creators.find(c => c.id === shop.createdById);
      return {
        ...shop,
        createdBy: creator || { id: shop.createdById, username: 'Unknown' }
      };
    });
    
    return {
      shops: shopsWithCreators,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getShops function:', error);
    
    // Fallback to minimal fields
    try {
      console.log('Trying minimal fields for shops');
      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            createdById: true
          },
          orderBy: { name: 'asc' }
        }),
        prisma.shop.count({ where }),
      ]);
      
      return {
        shops: shops.map(shop => ({
          ...shop,
          createdBy: { id: shop.createdById, username: 'Unknown' }
        })),
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit),
        },
      };
    } catch (fallbackError) {
      console.error('Even minimal field shop query failed:', fallbackError);
      throw error; // Re-throw the original error
    }
  }
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
    
    // Try with minimal fields first to avoid schema mismatches
    try {
      console.log('Attempting to create shop with minimal fields');
      const shop = await prisma.shop.create({
        data: {
          name,
          createdById: createdById,
        },
      });
      
      // If successful, update with additional fields
      try {
        console.log('Updating shop with additional fields');
        return await prisma.shop.update({
          where: { id: shop.id },
          data: {
            address,
            minCoffeeQuantityLarge: largeQty,
            minCoffeeQuantitySmall: smallQty,
          }
        });
      } catch (updateError) {
        console.error('Error updating shop with additional fields:', updateError);
        // We still created the shop, so return it even without the additional fields
        return shop;
      }
    } catch (minimalError) {
      console.error('Error creating shop with minimal fields:', minimalError);
      
      // If that fails, try with all fields in one go
      console.log('Attempting to create shop with all fields');
      const shop = await prisma.shop.create({
        data: {
          name,
          address,
          minCoffeeQuantityLarge: largeQty,
          minCoffeeQuantitySmall: smallQty,
          createdById: createdById,
        },
      });
      
      console.log('Shop created successfully with all fields:', shop.id);
      return shop;
    }
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