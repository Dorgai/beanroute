// One-off local migration to add 500g medium bag columns if missing
const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  try {
    console.log('[medium-columns] Starting check/add for medium bag columns...');

    const statements = [
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'RetailOrderItem' AND column_name = 'mediumBagsEspresso'
        ) THEN
          ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsEspresso" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'RetailOrderItem' AND column_name = 'mediumBagsFilter'
        ) THEN
          ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsFilter" INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;`,

      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'OrderTemplateItem' AND column_name = 'mediumBagsEspresso'
        ) THEN
          ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsEspresso" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'OrderTemplateItem' AND column_name = 'mediumBagsFilter'
        ) THEN
          ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsFilter" INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;`,

      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'RetailInventory' AND column_name = 'mediumBagsEspresso'
        ) THEN
          ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsEspresso" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'RetailInventory' AND column_name = 'mediumBagsFilter'
        ) THEN
          ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsFilter" INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;`
    ];

    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('[medium-columns] ✅ Medium bag columns ensured.');
  } catch (err) {
    console.error('[medium-columns] ❌ Error ensuring columns:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();


