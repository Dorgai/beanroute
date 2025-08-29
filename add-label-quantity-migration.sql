-- Migration to add labelQuantity field to GreenCoffee table
-- This migration adds label tracking functionality

-- Add labelQuantity column to GreenCoffee table
DO $$
BEGIN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GreenCoffee' 
        AND column_name = 'labelQuantity'
    ) THEN
        ALTER TABLE "GreenCoffee" ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 0;
        
        -- Optional: Set initial values for existing coffees
        -- You can set a default value like 100 labels for existing coffees
        UPDATE "GreenCoffee" SET "labelQuantity" = 100 WHERE "labelQuantity" = 0;
        
        RAISE NOTICE 'Added labelQuantity column to GreenCoffee table';
    ELSE
        RAISE NOTICE 'labelQuantity column already exists in GreenCoffee table';
    END IF;
END $$;
