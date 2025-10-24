-- Railway Database Migration: 500g Bag Support
-- This migration adds medium bag support (500g) to the retail ordering system
-- Date: 2025-01-28
-- Version: medium-bags-support-v1

-- Add medium bag columns to RetailOrderItem table
DO $$ 
BEGIN
    -- Add mediumBagsEspresso column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailOrderItem' 
        AND column_name = 'mediumBagsEspresso'
    ) THEN
        ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsEspresso column to RetailOrderItem';
    END IF;

    -- Add mediumBagsFilter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailOrderItem' 
        AND column_name = 'mediumBagsFilter'
    ) THEN
        ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsFilter column to RetailOrderItem';
    END IF;
END $$;

-- Add medium bag columns to OrderTemplateItem table
DO $$ 
BEGIN
    -- Add mediumBagsEspresso column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderTemplateItem' 
        AND column_name = 'mediumBagsEspresso'
    ) THEN
        ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsEspresso column to OrderTemplateItem';
    END IF;

    -- Add mediumBagsFilter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderTemplateItem' 
        AND column_name = 'mediumBagsFilter'
    ) THEN
        ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsFilter column to OrderTemplateItem';
    END IF;
END $$;

-- Add medium bag columns to RetailInventory table
DO $$ 
BEGIN
    -- Add mediumBagsEspresso column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailInventory' 
        AND column_name = 'mediumBagsEspresso'
    ) THEN
        ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsEspresso column to RetailInventory';
    END IF;

    -- Add mediumBagsFilter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailInventory' 
        AND column_name = 'mediumBagsFilter'
    ) THEN
        ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsFilter column to RetailInventory';
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

UPDATE "OrderTemplateItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "OrderTemplateItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

-- Add a migration record to track this migration
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    'medium-bags-migration-' || extract(epoch from now()),
    'medium-bags-support-v1',
    now(),
    '20250128_medium_bags_support',
    'Added medium bag support (500g) to retail ordering system',
    NULL,
    now(),
    1
) ON CONFLICT DO NOTHING;

-- Verify the migration was successful
SELECT 
    'RetailOrderItem' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'RetailOrderItem' 
AND column_name IN ('mediumBagsEspresso', 'mediumBagsFilter')

UNION ALL

SELECT 
    'OrderTemplateItem' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'OrderTemplateItem' 
AND column_name IN ('mediumBagsEspresso', 'mediumBagsFilter')

UNION ALL

SELECT 
    'RetailInventory' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'RetailInventory' 
AND column_name IN ('mediumBagsEspresso', 'mediumBagsFilter')

ORDER BY table_name, column_name;

RAISE NOTICE '500g bag support migration completed successfully!';
