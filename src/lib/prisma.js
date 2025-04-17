import { PrismaClient } from '@prisma/client';

// Debug logging for Prisma initialization
console.log('[Prisma] Initializing with: NODE_ENV =', process.env.NODE_ENV);
console.log('[Prisma] DATABASE_URL exists =', !!process.env.DATABASE_URL);

// In production, always create a new client
// In development, use global to preserve across hot reloads
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Only save to global in development to prevent memory leaks in production
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
