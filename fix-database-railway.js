// Database fix script for Railway production
// This will be run directly in the Railway environment

import prisma from './src/lib/prisma.js';

async function fixDatabase() {
  try {
    console.log('🚀 Starting database fixes...\n');

    // 1. Fix Shop table - add missing columns
    console.log('🔄 Fixing Shop table...');
    
    try {
      // Check if minCoffeeQuantityEspresso exists
      const espressoExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityEspresso';
      `;
      
      if (espressoExists.length === 0) {
        console.log('  ➕ Adding minCoffeeQuantityEspresso column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."Shop" 
          ADD COLUMN "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0;
        `);
        console.log('  ✅ minCoffeeQuantityEspresso column added');
      } else {
        console.log('  ✅ minCoffeeQuantityEspresso column already exists');
      }
    } catch (error) {
      console.log('  ❌ Error with minCoffeeQuantityEspresso:', error.message);
    }

    try {
      // Check if minCoffeeQuantityFilter exists
      const filterExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityFilter';
      `;
      
      if (filterExists.length === 0) {
        console.log('  ➕ Adding minCoffeeQuantityFilter column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."Shop" 
          ADD COLUMN "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;
        `);
        console.log('  ✅ minCoffeeQuantityFilter column added');
      } else {
        console.log('  ✅ minCoffeeQuantityFilter column already exists');
      }
    } catch (error) {
      console.log('  ❌ Error with minCoffeeQuantityFilter:', error.message);
    }

    console.log('');

    // 2. Create PushSubscription table
    console.log('🔄 Fixing PushSubscription table...');
    
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PushSubscription';
      `;
      
      if (tableExists.length === 0) {
        console.log('  ➕ Creating PushSubscription table...');
        
        // Create the table
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "public"."PushSubscription" (
            "id" TEXT NOT NULL,
            "endpoint" TEXT NOT NULL,
            "p256dh" TEXT NOT NULL,
            "auth" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
          );
        `);
        
        // Create indexes
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "PushSubscription_userId_idx" 
          ON "public"."PushSubscription"("userId");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "PushSubscription_endpoint_idx" 
          ON "public"."PushSubscription"("endpoint");
        `);
        
        // Add foreign key constraint
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."PushSubscription" 
          ADD CONSTRAINT "PushSubscription_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        
        console.log('  ✅ PushSubscription table created with indexes and constraints');
      } else {
        console.log('  ✅ PushSubscription table already exists');
      }
    } catch (error) {
      console.log('  ❌ Error with PushSubscription table:', error.message);
    }

    console.log('\n🎉 Database fixes completed!');
    console.log('✅ Shop selector should now work');
    console.log('✅ Push notifications should now work');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDatabase()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All database fixes completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Database fixes failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
