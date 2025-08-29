// PUBLIC migration endpoint - completely bypass authentication
// TEMPORARY - will be deleted after migration

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[public-migration] Starting InventoryEmailNotification table creation...');

    // Check if table already exists
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryEmailNotification';
    `;
    
    if (existingTables.length > 0) {
      console.log('[public-migration] Table already exists');
      return res.status(200).json({
        success: true,
        message: 'InventoryEmailNotification table already exists',
        tableExists: true
      });
    }

    console.log('[public-migration] Creating InventoryEmailNotification table...');
    
    // Create the table with TEXT type for UUID fields to match Prisma's string-based UUIDs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "public"."InventoryEmailNotification" (
        "id" TEXT NOT NULL,
        "shopId" TEXT,
        "emails" TEXT[] NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT true,
        "alertType" TEXT NOT NULL DEFAULT 'ALL',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdById" TEXT NOT NULL,
        CONSTRAINT "InventoryEmailNotification_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('[public-migration] Creating indexes...');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "InventoryEmailNotification_shopId_idx" 
      ON "public"."InventoryEmailNotification"("shopId");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "InventoryEmailNotification_alertType_idx" 
      ON "public"."InventoryEmailNotification"("alertType");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "InventoryEmailNotification_shopId_alertType_key" 
      ON "public"."InventoryEmailNotification"("shopId", "alertType");
    `);
    
    console.log('[public-migration] Adding foreign key constraints...');
    
    // Add foreign key constraints
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."InventoryEmailNotification" 
      ADD CONSTRAINT "InventoryEmailNotification_shopId_fkey" 
      FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."InventoryEmailNotification" 
      ADD CONSTRAINT "InventoryEmailNotification_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
    
    // Verify the table was created
    const verifyResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryEmailNotification';
    `;
    
    console.log('[public-migration] Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'InventoryEmailNotification table created successfully! The shop selector should now work.',
      tableExists: verifyResult.length > 0,
      details: {
        tableCreated: true,
        indexesCreated: true,
        constraintsAdded: true,
        verificationPassed: verifyResult.length > 0
      }
    });

  } catch (error) {
    console.error('[public-migration] Error:', error);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

