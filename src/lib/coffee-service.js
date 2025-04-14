import prisma from './prisma';

/**
 * Get all coffee entries with pagination and search options
 */
export async function getAllCoffee({ page = 1, pageSize = 10, search = '' }) {
  const skip = (page - 1) * pageSize;
  
  // Build search filter if search term provided
  const where = search 
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { roaster: { contains: search, mode: 'insensitive' } },
          { origin: { contains: search, mode: 'insensitive' } },
          { process: { contains: search, mode: 'insensitive' } },
        ],
      } 
    : {};
  
  // Get coffee entries and count in parallel for efficiency
  const [coffee, total] = await Promise.all([
    prisma.greenCoffee.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    }),
    prisma.greenCoffee.count({ where }),
  ]);
  
  return {
    coffee,
    total
  };
}

/**
 * Get a single coffee entry by ID
 */
export async function getCoffeeById(id) {
  if (!id) throw new Error('Coffee ID is required');
  
  const coffee = await prisma.greenCoffee.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      inventoryLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }
    }
  });
  
  if (!coffee) {
    throw new Error('Coffee not found');
  }
  
  return coffee;
}

/**
 * Create a new coffee entry
 */
export async function createCoffee(data) {
  // Check if coffee with same name already exists
  const existingCoffee = await prisma.greenCoffee.findFirst({
    where: { 
      name: data.name,
      // Add more fields if uniqueness is based on multiple fields
    }
  });
  
  if (existingCoffee) {
    throw new Error('Coffee with this name already exists');
  }
  
  return await prisma.greenCoffee.create({
    data: {
      name: data.name,
      grade: data.grade || 'SPECIALTY',
      quantity: data.quantity || 0,
      country: data.origin || '',
      producer: data.roaster || '',
      notes: data.notes || '',
      createdById: data.createdBy
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
}

/**
 * Update an existing coffee entry
 */
export async function updateCoffee(id, data) {
  // Check if coffee exists
  const coffee = await prisma.greenCoffee.findUnique({
    where: { id }
  });
  
  if (!coffee) {
    throw new Error('Coffee not found');
  }
  
  // Check if new name conflicts with existing coffee (except self)
  if (data.name !== coffee.name) {
    const existingCoffee = await prisma.greenCoffee.findFirst({
      where: { 
        name: data.name,
        id: { not: id }
      }
    });
    
    if (existingCoffee) {
      throw new Error('Coffee with this name already exists');
    }
  }
  
  return await prisma.greenCoffee.update({
    where: { id },
    data: {
      name: data.name,
      grade: data.grade || coffee.grade,
      country: data.origin || coffee.country,
      producer: data.roaster || coffee.producer,
      notes: data.notes || coffee.notes,
      updatedAt: new Date()
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
}

/**
 * Delete a coffee entry
 */
export async function deleteCoffee(id) {
  // Check if coffee exists
  const coffee = await prisma.greenCoffee.findUnique({
    where: { id }
  });
  
  if (!coffee) {
    throw new Error('Coffee not found');
  }
  
  return await prisma.greenCoffee.delete({
    where: { id }
  });
}

/**
 * Add inventory to a coffee entry
 */
export async function addCoffeeInventory(coffeeId, amount, userId, notes = '') {
  const coffee = await prisma.greenCoffee.findUnique({
    where: { id: coffeeId }
  });
  
  if (!coffee) {
    throw new Error('Coffee not found');
  }
  
  const newQuantity = coffee.quantity + parseFloat(amount);
  
  // Update coffee quantity and create log in a transaction
  return prisma.$transaction(async (tx) => {
    // Update coffee quantity
    const updatedCoffee = await tx.greenCoffee.update({
      where: { id: coffeeId },
      data: { quantity: newQuantity }
    });
    
    // Create inventory log
    const log = await tx.greenCoffeeInventoryLog.create({
      data: {
        coffeeId,
        userId,
        changeAmount: parseFloat(amount),
        quantity: newQuantity,
        notes
      }
    });
    
    return { coffee: updatedCoffee, log };
  });
}

/**
 * Get coffee inventory logs
 */
export async function getCoffeeInventoryLogs(coffeeId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.greenCoffeeInventoryLog.findMany({
      where: { coffeeId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    }),
    prisma.greenCoffeeInventoryLog.count({ where: { coffeeId } })
  ]);
  
  return {
    logs,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit)
    }
  };
}

/**
 * Get a summary of all coffee (for dashboard)
 */
export async function getCoffeeSummary() {
  // Get total coffee count
  const totalCount = await prisma.greenCoffee.count();
  
  // Get total coffee quantity
  const quantityResult = await prisma.greenCoffee.aggregate({
    _sum: {
      quantity: true
    }
  });
  const totalQuantity = quantityResult._sum.quantity || 0;
  
  // Get coffee by country
  const byCountry = await prisma.greenCoffee.groupBy({
    by: ['country'],
    _count: {
      id: true
    },
    _sum: {
      quantity: true
    }
  });
  
  return {
    totalCount,
    totalQuantity,
    byCountry: byCountry.map(item => ({
      country: item.country || 'Unknown',
      count: item._count.id,
      quantity: item._sum.quantity || 0
    }))
  };
}

/**
 * Get total coffee inventory (sum of all coffee quantities)
 */
export async function getTotalCoffeeInventory() {
  try {
    const result = await prisma.greenCoffee.aggregate({
      _sum: {
        quantity: true
      }
    });
    
    return result._sum.quantity || 0;
  } catch (error) {
    console.error('Error calculating total coffee inventory:', error);
    return 0;
  }
}

/**
 * Get coffee stock summary information
 */
export async function getCoffeeStockSummary() {
  try {
    // Get total coffee quantity
    const totalQuantity = await prisma.greenCoffee.aggregate({
      _sum: {
        quantity: true
      }
    });
    
    // Get count of coffee types
    const coffeeCount = await prisma.greenCoffee.count();
    
    // Get low stock coffee (less than 10kg)
    const lowStockCoffee = await prisma.greenCoffee.findMany({
      where: {
        quantity: {
          lt: 10
        }
      },
      select: {
        id: true,
        name: true,
        quantity: true
      },
      orderBy: {
        quantity: 'asc'
      },
      take: 5
    });
    
    // Get top 5 coffee by quantity
    const topCoffee = await prisma.greenCoffee.findMany({
      select: {
        id: true,
        name: true,
        quantity: true
      },
      orderBy: {
        quantity: 'desc'
      },
      take: 5
    });
    
    return {
      totalQuantity: totalQuantity._sum.quantity || 0,
      coffeeCount,
      lowStockCoffee,
      topCoffee
    };
  } catch (error) {
    console.error('Error getting coffee stock summary:', error);
    return {
      totalQuantity: 0,
      coffeeCount: 0,
      lowStockCoffee: [],
      topCoffee: []
    };
  }
}

/**
 * Get all coffee inventory logs across all coffees
 */
export async function getAllCoffeeInventoryLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.greenCoffeeInventoryLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        coffee: {
          select: {
            id: true,
            name: true,
            country: true,
            producer: true
          }
        }
      }
    }),
    prisma.greenCoffeeInventoryLog.count()
  ]);
  
  return {
    logs,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit)
    }
  };
} 