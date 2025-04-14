import { verifyRequestAndGetUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Verify authentication and ensure only admins can run this
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only admins can perform this action' });
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Run the raw SQL to modify the UserActivity table if needed
    try {
      // Check if resource column exists
      const queryResult = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'UserActivity' AND column_name = 'resource';
      `;
      
      const resourceColumnExists = queryResult.length > 0;
      
      if (!resourceColumnExists) {
        // Add resource column
        await prisma.$executeRaw`
          ALTER TABLE "UserActivity" ADD COLUMN "resource" TEXT DEFAULT 'USER';
        `;
        
        // Add resourceId column if it doesn't exist
        await prisma.$executeRaw`
          ALTER TABLE "UserActivity" ADD COLUMN "resourceId" TEXT NULL;
        `;
        
        // Create indexes for better performance
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "UserActivity_resource_idx" ON "UserActivity"("resource");
        `;
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "UserActivity_resourceId_idx" ON "UserActivity"("resourceId");
        `;
      }
      
      // Check for other columns
      const ipColumnExists = (await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'UserActivity' AND column_name = 'ipAddress';
      `).length > 0;
      
      if (!ipColumnExists) {
        await prisma.$executeRaw`
          ALTER TABLE "UserActivity" ADD COLUMN "ipAddress" TEXT NULL;
        `;
        await prisma.$executeRaw`
          ALTER TABLE "UserActivity" ADD COLUMN "userAgent" TEXT NULL;
        `;
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Schema updated successfully',
        changes: {
          resourceAdded: !resourceColumnExists,
          ipAddressAdded: !ipColumnExists
        }
      });
    } catch (error) {
      console.error('Error updating schema:', error);
      return res.status(500).json({ error: 'Failed to update schema', details: error.message });
    }
  } catch (error) {
    console.error('Error in fix-schema API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 