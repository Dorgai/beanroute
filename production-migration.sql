-- Create InventoryEmailNotification table for production
CREATE TABLE IF NOT EXISTS "public"."InventoryEmailNotification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shopId" UUID,
    "emails" TEXT[] NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertType" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "InventoryEmailNotification_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "InventoryEmailNotification_shopId_idx" ON "public"."InventoryEmailNotification"("shopId");
CREATE INDEX IF NOT EXISTS "InventoryEmailNotification_alertType_idx" ON "public"."InventoryEmailNotification"("alertType");

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryEmailNotification_shopId_alertType_key" ON "public"."InventoryEmailNotification"("shopId", "alertType");

-- Add foreign key constraints
ALTER TABLE "public"."InventoryEmailNotification" 
ADD CONSTRAINT "InventoryEmailNotification_shopId_fkey" 
FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."InventoryEmailNotification" 
ADD CONSTRAINT "InventoryEmailNotification_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add migration record (if _prisma_migrations table exists)
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid(),
    'b2ef8f6a1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    NOW(),
    '20250815000000_add_inventory_email_notifications',
    '',
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

