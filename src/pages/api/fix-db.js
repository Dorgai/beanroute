import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    const result = {
      success: true,
      message: 'Production database fix completed successfully!',
      existingTables: existingTables,
      data: {
        users: userCount,
        shops: shopCount,
        coffeeTypes: coffeeCount
      }
    };

    console.log(`📊 Data counts: ${userCount} users, ${shopCount} shops, ${coffeeCount} coffee types`);
    console.log('✅ Production database fix completed successfully!');
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    return res.status(500).json({ 
      error: 'Failed to fix production database',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}
