const { PrismaClient } = require('@prisma/client');

async function fixProductionDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Fixing production database...');
    
    // Check what tables exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📊 Existing tables:', existingTables);
    
    // Add medium bag columns to RetailOrderItem
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'RetailOrderItem' 
                AND column_name = 'mediumBagsEspresso'
            ) THEN
                ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
                RAISE NOTICE 'Added mediumBagsEspresso column to RetailOrderItem';
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'RetailOrderItem' 
                AND column_name = 'mediumBagsFilter'
            ) THEN
                ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
                RAISE NOTICE 'Added mediumBagsFilter column to RetailOrderItem';
            END IF;
        END $$;
      `;
      console.log('✅ Added medium bag columns to RetailOrderItem');
    } catch (error) {
      console.log('⚠️  RetailOrderItem error:', error.message);
    }

    // Add medium bag columns to RetailInventory
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'RetailInventory' 
                AND column_name = 'mediumBagsEspresso'
            ) THEN
                ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
                RAISE NOTICE 'Added mediumBagsEspresso column to RetailInventory';
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'RetailInventory' 
                AND column_name = 'mediumBagsFilter'
            ) THEN
                ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
                RAISE NOTICE 'Added mediumBagsFilter column to RetailInventory';
            END IF;
        END $$;
      `;
      console.log('✅ Added medium bag columns to RetailInventory');
    } catch (error) {
      console.log('⚠️  RetailInventory error:', error.message);
    }

    // Update existing records
    try {
      await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
      await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
      console.log('✅ Updated RetailOrderItem records');
    } catch (error) {
      console.log('⚠️  Could not update RetailOrderItem:', error.message);
    }

    try {
      await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
      await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
      console.log('✅ Updated RetailInventory records');
    } catch (error) {
      console.log('⚠️  Could not update RetailInventory:', error.message);
    }

    // Check data counts
    const userCount = await prisma.user.count();
    const shopCount = await prisma.shop.count();
    const coffeeCount = await prisma.greenCoffee.count();
    
    console.log(`📊 Data counts: ${userCount} users, ${shopCount} shops, ${coffeeCount} coffee types`);
    console.log('✅ Production database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionDatabase()
  .then(() => {
    console.log('🎉 Database fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });
