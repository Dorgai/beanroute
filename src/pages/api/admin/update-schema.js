import { verifyRequestAndGetUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req, res);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow ADMIN or OWNER to update schema
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const updates = [];
    const missingColumns = [];
    
    // Check if resource column exists in UserActivity
    try {
      await prisma.$queryRaw`SELECT resource FROM "UserActivity" LIMIT 1`;
    } catch (error) {
      if (error.message.includes('column "resource" does not exist')) {
        missingColumns.push('resource');
        updates.push('Added resource column to UserActivity');
        await prisma.$executeRaw`ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "resource" TEXT`;
      }
    }
    
    // Check if resourceId column exists
    try {
      await prisma.$queryRaw`SELECT "resourceId" FROM "UserActivity" LIMIT 1`;
    } catch (error) {
      if (error.message.includes('column "resourceId" does not exist')) {
        missingColumns.push('resourceId');
        updates.push('Added resourceId column to UserActivity');
        await prisma.$executeRaw`ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "resourceId" TEXT`;
      }
    }
    
    // Check if ipAddress column exists
    try {
      await prisma.$queryRaw`SELECT "ipAddress" FROM "UserActivity" LIMIT 1`;
    } catch (error) {
      if (error.message.includes('column "ipAddress" does not exist')) {
        missingColumns.push('ipAddress');
        updates.push('Added ipAddress column to UserActivity');
        await prisma.$executeRaw`ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT`;
      }
    }
    
    // Check if userAgent column exists
    try {
      await prisma.$queryRaw`SELECT "userAgent" FROM "UserActivity" LIMIT 1`;
    } catch (error) {
      if (error.message.includes('column "userAgent" does not exist')) {
        missingColumns.push('userAgent');
        updates.push('Added userAgent column to UserActivity');
        await prisma.$executeRaw`ALTER TABLE "UserActivity" ADD COLUMN IF NOT EXISTS "userAgent" TEXT`;
      }
    }
    
    // Create indexes if necessary
    if (missingColumns.includes('resource')) {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserActivity_resource_idx" ON "UserActivity"("resource")`;
      updates.push('Created index on resource column');
    }
    
    if (missingColumns.includes('resourceId')) {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserActivity_resourceId_idx" ON "UserActivity"("resourceId")`;
      updates.push('Created index on resourceId column');
    }

    return res.status(200).json({ 
      message: 'Schema update completed successfully', 
      updates,
      missingColumns
    });
  } catch (error) {
    console.error('Error updating schema:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 