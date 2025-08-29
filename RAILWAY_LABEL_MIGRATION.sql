-- Railway Production Database Migration
-- Run this SQL in Railway's Database Dashboard -> Data -> SQL Editor
-- This adds the missing labelQuantity column to the GreenCoffee table

-- Step 1: Check if column already exists (this query should return 0 rows if column is missing)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'GreenCoffee' 
AND column_name = 'labelQuantity';

-- Step 2: Add the labelQuantity column if it doesn't exist
DO $$
BEGIN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GreenCoffee' 
        AND column_name = 'labelQuantity'
    ) THEN
        -- Add the column
        ALTER TABLE "GreenCoffee" ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 0;
        
        -- Set initial values for existing coffees (100 labels each)
        UPDATE "GreenCoffee" SET "labelQuantity" = 100 WHERE "labelQuantity" = 0;
        
        RAISE NOTICE 'Added labelQuantity column to GreenCoffee table and set default values';
    ELSE
        RAISE NOTICE 'labelQuantity column already exists in GreenCoffee table';
    END IF;
END $$;

-- Step 3: Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'GreenCoffee' 
AND column_name = 'labelQuantity';

-- Step 4: Check a few sample records to confirm the default values were set
SELECT id, name, "labelQuantity" 
FROM "GreenCoffee" 
LIMIT 5;
