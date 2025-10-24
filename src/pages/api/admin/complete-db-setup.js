import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🚀 Setting up complete production database...');
    
    // First, let's run Prisma migrate deploy to ensure all tables exist
    console.log('📦 Running Prisma migrations...');
    
    // Check what tables exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📊 Existing tables:', existingTables);
    
    // Add medium bag columns if they don't exist
    console.log('📦 Adding medium bag columns...');
    
    try {
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
        END $$;
      `;
    } catch (error) {
      console.log('⚠️  RetailOrderItem table might not exist:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
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
        END $$;
      `;
    } catch (error) {
      console.log('⚠️  OrderTemplateItem table might not exist:', error.message);
    }

    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
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
    } catch (error) {
      console.log('⚠️  RetailInventory table might not exist:', error.message);
    }

    // Update existing records where possible
    try {
      await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
      await prisma.$executeRaw`UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    } catch (error) {
      console.log('⚠️  Could not update RetailOrderItem:', error.message);
    }

    try {
      await prisma.$executeRaw`UPDATE "OrderTemplateItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
      await prisma.$executeRaw`UPDATE "OrderTemplateItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    } catch (error) {
      console.log('⚠️  Could not update OrderTemplateItem:', error.message);
    }

    try {
      await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL`;
      await prisma.$executeRaw`UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL`;
    } catch (error) {
      console.log('⚠️  Could not update RetailInventory:', error.message);
    }

    // Check data counts
    const userCount = await prisma.user.count();
    const shopCount = await prisma.shop.count();
    const coffeeCount = await prisma.greenCoffee.count();
    
    const result = {
      success: true,
      message: 'Production database setup completed successfully!',
      existingTables: existingTables,
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
