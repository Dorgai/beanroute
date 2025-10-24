const { PrismaClient } = require('@prisma/client');

async function setupProductionDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Setting up production database...');
    
    // Add medium bag columns if they don't exist
    console.log('📦 Adding medium bag columns...');
    
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Add mediumBagsEspresso column to RetailOrderItem if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'RetailOrderItem' 
              AND column_name = 'mediumBagsEspresso'
          ) THEN
              ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
              RAISE NOTICE 'Added mediumBagsEspresso column to RetailOrderItem';
          END IF;

          -- Add mediumBagsFilter column to RetailOrderItem if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'RetailOrderItem' 
              AND column_name = 'mediumBagsFilter'
          ) THEN
              ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
              RAISE NOTICE 'Added mediumBagsFilter column to RetailOrderItem';
          END IF;

          -- Add mediumBagsEspresso column to OrderTemplateItem if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'OrderTemplateItem' 
              AND column_name = 'mediumBagsEspresso'
          ) THEN
              ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
              RAISE NOTICE 'Added mediumBagsEspresso column to OrderTemplateItem';
          END IF;

          -- Add mediumBagsFilter column to OrderTemplateItem if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'OrderTemplateItem' 
              AND column_name = 'mediumBagsFilter'
          ) THEN
              ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
              RAISE NOTICE 'Added mediumBagsFilter column to OrderTemplateItem';
          END IF;

          -- Add mediumBagsEspresso column to RetailInventory if it doesn't exist
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'RetailInventory' 
              AND column_name = 'mediumBagsEspresso'
          ) THEN
              ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
              RAISE NOTICE 'Added mediumBagsEspresso column to RetailInventory';
          END IF;

          -- Add mediumBagsFilter column to RetailInventory if it doesn't exist
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

    // Update existing records
    console.log('🔄 Updating existing records...');
    await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    await prisma.$executeRaw`UPDATE "OrderTemplateItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
    await prisma.$executeRaw`UPDATE "OrderTemplateItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
    await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;

    // Check if we have basic data
    console.log('🔍 Checking existing data...');
    const userCount = await prisma.user.count();
    const shopCount = await prisma.shop.count();
    const coffeeCount = await prisma.greenCoffee.count();
    
    console.log(`📊 Current data: ${userCount} users, ${shopCount} shops, ${coffeeCount} coffee types`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found - database may need seeding');
    }
    
    if (shopCount === 0) {
      console.log('⚠️  No shops found - database may need seeding');
    }
    
    if (coffeeCount === 0) {
      console.log('⚠️  No coffee types found - database may need seeding');
    }

    console.log('✅ Production database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupProductionDatabase()
  .then(() => {
    console.log('🎉 Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  });
