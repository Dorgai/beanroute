-- Railway Database Fix for 500g Bag Support
-- Run this script in Railway Dashboard > Database > SQL Editor

-- Step 1: Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Add medium bag columns to RetailOrderItem
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
    ELSE
        RAISE NOTICE 'mediumBagsEspresso column already exists in RetailOrderItem';
    END IF;

    -- Add mediumBagsFilter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailOrderItem' 
        AND column_name = 'mediumBagsFilter'
    ) THEN
        ALTER TABLE "RetailOrderItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsFilter column to RetailOrderItem';
    ELSE
        RAISE NOTICE 'mediumBagsFilter column already exists in RetailOrderItem';
    END IF;
END $$;

-- Step 3: Add medium bag columns to RetailInventory
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
    ELSE
        RAISE NOTICE 'mediumBagsEspresso column already exists in RetailInventory';
    END IF;

    -- Add mediumBagsFilter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RetailInventory' 
        AND column_name = 'mediumBagsFilter'
    ) THEN
        ALTER TABLE "RetailInventory" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mediumBagsFilter column to RetailInventory';
    ELSE
        RAISE NOTICE 'mediumBagsFilter column already exists in RetailInventory';
    END IF;
END $$;

-- Step 4: Add medium bag columns to OrderTemplateItem (if table exists)
DO $$ 
BEGIN
    -- Check if OrderTemplateItem table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'OrderTemplateItem'
    ) THEN
        -- Add mediumBagsEspresso column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderTemplateItem' 
            AND column_name = 'mediumBagsEspresso'
        ) THEN
            ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsEspresso" INTEGER DEFAULT 0;
            RAISE NOTICE 'Added mediumBagsEspresso column to OrderTemplateItem';
        ELSE
            RAISE NOTICE 'mediumBagsEspresso column already exists in OrderTemplateItem';
        END IF;

        -- Add mediumBagsFilter column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderTemplateItem' 
            AND column_name = 'mediumBagsFilter'
        ) THEN
            ALTER TABLE "OrderTemplateItem" ADD COLUMN "mediumBagsFilter" INTEGER DEFAULT 0;
            RAISE NOTICE 'Added mediumBagsFilter column to OrderTemplateItem';
        ELSE
            RAISE NOTICE 'mediumBagsFilter column already exists in OrderTemplateItem';
        END IF;
    ELSE
        RAISE NOTICE 'OrderTemplateItem table does not exist - skipping';
    END IF;
END $$;

-- Step 5: Update existing records to have default values
UPDATE "RetailOrderItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailOrderItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

UPDATE "RetailInventory" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
UPDATE "RetailInventory" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;

-- Update OrderTemplateItem if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'OrderTemplateItem'
    ) THEN
        UPDATE "OrderTemplateItem" SET "mediumBagsEspresso" = 0 WHERE "mediumBagsEspresso" IS NULL;
        UPDATE "OrderTemplateItem" SET "mediumBagsFilter" = 0 WHERE "mediumBagsFilter" IS NULL;
        RAISE NOTICE 'Updated OrderTemplateItem records';
    END IF;
END $$;

-- Step 6: Verify the changes
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
    'RetailInventory' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'RetailInventory' 
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

ORDER BY table_name, column_name;

-- Step 7: Check data counts
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Shops', COUNT(*) FROM "Shop"
UNION ALL
SELECT 'GreenCoffee', COUNT(*) FROM "GreenCoffee"
UNION ALL
SELECT 'RetailInventory', COUNT(*) FROM "RetailInventory"
UNION ALL
SELECT 'RetailOrder', COUNT(*) FROM "RetailOrder";

-- Success message
SELECT 'Database fix completed successfully! 500g bag support is now enabled.' as status;
