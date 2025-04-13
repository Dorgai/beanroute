-- First, modify the Role enum to include new roles
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OWNER', 'RETAILER', 'BARISTA');

-- Update existing users with the new role mapping
-- Existing ADMIN -> ADMIN
-- Existing MANAGER -> RETAILER
-- Existing USER -> BARISTA
UPDATE "User" SET "role" = 'ADMIN'::"Role" WHERE "role" = 'ADMIN'::"Role_old";
UPDATE "User" SET "role" = 'RETAILER'::"Role" WHERE "role" = 'MANAGER'::"Role_old";
UPDATE "User" SET "role" = 'BARISTA'::"Role" WHERE "role" = 'USER'::"Role_old";

-- Drop the old enum after migration
DROP TYPE "Role_old";

-- Create Shop table
CREATE TABLE "Shop" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "minCoffeeQuantityLarge" INTEGER NOT NULL DEFAULT 0,
  "minCoffeeQuantitySmall" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- Create UserShop junction table
CREATE TABLE "UserShop" (
  "userId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'BARISTA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserShop_pkey" PRIMARY KEY ("userId","shopId")
);

-- Create indexes
CREATE UNIQUE INDEX "Shop_name_key" ON "Shop"("name");

-- Add foreign key constraints
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create a sample shop if none exists
INSERT INTO "Shop" ("id", "name", "address", "minCoffeeQuantityLarge", "minCoffeeQuantitySmall", "createdAt", "updatedAt", "createdById")
SELECT 
  'shop-' || gen_random_uuid(), 
  'Sample Coffee Shop', 
  '123 Coffee Street', 
  5, 
  20, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP, 
  id
FROM "User"
WHERE role = 'ADMIN'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update Prisma migrations record
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  'manual-shop-migration', 
  'manual shop migration', 
  CURRENT_TIMESTAMP, 
  '20250413200000_shop_management', 
  'Applied manually via SQL script', 
  NULL, 
  CURRENT_TIMESTAMP, 
  1
) ON CONFLICT DO NOTHING; 