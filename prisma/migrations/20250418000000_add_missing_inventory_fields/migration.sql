-- Add missing fields to RetailInventory table
ALTER TABLE "RetailInventory" 
ADD COLUMN IF NOT EXISTS "smallBagsEspresso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "smallBagsFilter" INTEGER NOT NULL DEFAULT 0;

-- Add missing fields to RetailOrderItem table  
ALTER TABLE "RetailOrderItem"
ADD COLUMN IF NOT EXISTS "smallBagsEspresso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "smallBagsFilter" INTEGER NOT NULL DEFAULT 0;

-- Add missing fields to Shop table
ALTER TABLE "Shop"
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "zipCode" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;

-- Add missing fields to GreenCoffee table
ALTER TABLE "GreenCoffee"
ADD COLUMN IF NOT EXISTS "isEspresso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isFilter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isSignature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;

-- Add missing fields to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'BARISTA',
ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- Create SystemSettings table if it doesn't exist (for haircut percentage)
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SystemSettings_key_key') THEN
    ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_key_key" UNIQUE ("key");
  END IF;
END $$;

-- Insert default haircut percentage if it doesn't exist
INSERT INTO "SystemSettings" ("id", "key", "value") 
VALUES (gen_random_uuid(), 'coffee_processing_haircut_percentage', '15')
ON CONFLICT ("key") DO NOTHING;
