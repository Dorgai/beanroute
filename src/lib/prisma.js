import { PrismaClient } from '@prisma/client';

// Debug logging for Prisma initialization
console.log('[Prisma] Initializing with: NODE_ENV =', process.env.NODE_ENV);
console.log('[Prisma] DATABASE_URL exists =', !!process.env.DATABASE_URL);

// Add better error handling and connection management
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, create a single instance of PrismaClient
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Add connection error handling
async function ensureConnection() {
  try {
    // Run a simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Prisma] Connection verified');
    return true;
  } catch (error) {
    console.error('[Prisma] Connection error:', error);
    
    // Try to reconnect
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('[Prisma] Reconnected successfully');
      return true;
    } catch (reconnectError) {
      console.error('[Prisma] Failed to reconnect:', reconnectError);
      return false;
    }
  }
}

// Wrap the prisma client with connection verification
const safePrisma = new Proxy(prisma, {
  get(target, prop) {
    const originalMethod = target[prop];
    
    // Only intercept methods that might need a connection
    if (typeof originalMethod === 'function' && 
        !['$connect', '$disconnect', '$on', '$transaction'].includes(prop)) {
      return async (...args) => {
        await ensureConnection();
        return originalMethod.apply(target, args);
      };
    }
    
    return originalMethod;
  }
});

export default safePrisma;
