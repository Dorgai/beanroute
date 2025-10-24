import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    const result = {
      success: true,
      message: 'Production database setup completed successfully!',
      data: {
        users: userCount,
        shops: shopCount,
        coffeeTypes: coffeeCount,
        needsSeeding: userCount === 0 || shopCount === 0 || coffeeCount === 0
      }
    };

    console.log('✅ Production database setup completed successfully!');
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    return res.status(500).json({ 
      error: 'Failed to setup production database',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
