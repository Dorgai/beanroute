import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow direct access for this migration
  const directAccess = req.query.direct === 'true';
  if (!directAccess) {
    return res.status(401).json({ error: 'Direct access required. Use ?direct=true' });
  }

  const prisma = new PrismaClient();
  
  try {
    console.log('Fixing UserActivity schema...');
    
    // Add missing columns using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE "UserActivity" 
      ADD COLUMN IF NOT EXISTS "resource" TEXT DEFAULT 'USER'
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "UserActivity" 
      ADD COLUMN IF NOT EXISTS "resourceId" TEXT
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "UserActivity" 
      ADD COLUMN IF NOT EXISTS "ipAddress" TEXT
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "UserActivity" 
      ADD COLUMN IF NOT EXISTS "userAgent" TEXT
    `;
    
    // Update existing records to have valid resource values
    await prisma.$executeRaw`
      UPDATE "UserActivity" 
      SET "resource" = 'USER' 
      WHERE "resource" IS NULL
    `;
    
    console.log('UserActivity schema fixed successfully');
    
    return res.status(200).json({ 
      success: true, 
      message: 'UserActivity schema fixed successfully' 
    });
    
  } catch (error) {
    console.error('Error fixing UserActivity schema:', error);
    return res.status(500).json({ 
      error: 'Failed to fix schema', 
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
