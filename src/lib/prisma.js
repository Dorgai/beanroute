import { PrismaClient } from '@prisma/client';

// Use singleton pattern to prevent multiple instances
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 