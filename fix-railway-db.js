const { PrismaClient } = require('@prisma/client');

// This script connects to Railway production database and fixes the 500g bag support
async function fixRailwayDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Connecting to Railway production database...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to Railway database');
    
    // Check existing tables
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📊 Existing tables:', existingTables.map(t => t.table_name));
    
    // Add medium bag columns to RetailOrderItem
    console.log('📦 Adding medium bag columns to RetailOrderItem...');
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

    // Add medium bag columns to RetailInventory
    console.log('📦 Adding medium bag columns to RetailInventory...');
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

    // Add medium bag columns to OrderTemplateItem (if exists)
    console.log('📦 Checking OrderTemplateItem table...');
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'OrderTemplateItem'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'OrderTemplateItem' 
                    AND column_name = 'mediumBagsEspresso'
                ) THEN
                    ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
                    RAISE NOTICE 'Added mediumBagsEspresso column to OrderTemplateItem';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'OrderTemplateItem' 
                    AND column_name = 'mediumBagsFilter'
                ) THEN
                    ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
                    RAISE NOTICE 'Added mediumBagsFilter column to OrderTemplateItem';
                END IF;
            END IF;
        END $$;
      `;
      console.log('✅ Added medium bag columns to OrderTemplateItem (if exists)');
    } catch (error) {
      console.log('⚠️  OrderTemplateItem might not exist:', error.message);
    }

    // Update existing records
    console.log('🔄 Updating existing records...');
    await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    console.log('✅ Updated existing records');

    // Check data counts
    const userCount = await prisma.user.count();
    const shopCount = await prisma.shop.count();
    const coffeeCount = await prisma.greenCoffee.count();
    const inventoryCount = await prisma.retailInventory.count();
    const orderCount = await prisma.retailOrder.count();
    
    console.log('📊 Database status:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Shops: ${shopCount}`);
    console.log(`   - Coffee types: ${coffeeCount}`);
    console.log(`   - Inventory records: ${inventoryCount}`);
    console.log(`   - Orders: ${orderCount}`);
    
    console.log('🎉 Railway database fix completed successfully!');
    console.log('✅ 500g bag support is now enabled in production');
    
  } catch (error) {
    console.error('❌ Error fixing Railway database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRailwayDatabase()
  .then(() => {
    console.log('🚀 Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });