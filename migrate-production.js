// Run this script in Railway production to create the missing table
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createInventoryEmailNotificationTable() {
  try {
    console.log('🚀 Starting migration...');
    
    // Check if table already exists
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryEmailNotification';
    `;
    
    if (existingTables.length > 0) {
      console.log('✅ Table already exists, skipping creation');
      return;
    }
    
    console.log('📦 Creating InventoryEmailNotification table...');
    
    // Create the table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "public"."InventoryEmailNotification" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "shopId" UUID,
        "emails" TEXT[] NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT true,
        "alertType" TEXT NOT NULL DEFAULT 'ALL',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdById" UUID NOT NULL,
        CONSTRAINT "InventoryEmailNotification_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('🔗 Creating indexes...');
    
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
    
    console.log('🔑 Adding foreign key constraints...');
    
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
    
    if (verifyResult.length > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('📊 Table created with proper indexes and constraints');
    } else {
      console.log('❌ Migration verification failed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createInventoryEmailNotificationTable()
    .then(() => {
      console.log('🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { createInventoryEmailNotificationTable };
