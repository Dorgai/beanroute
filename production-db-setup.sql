-- Production Database Setup for BeanRoute
-- This script sets up the complete database schema and seed data

-- First, let's check what tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Add medium bag columns if they don't exist
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

-- Update existing records to have default values for new columns
UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

UPDATE "OrderTemplateItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "OrderTemplateItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

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
