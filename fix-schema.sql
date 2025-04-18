-- Add missing columns to Shop table
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Create a run-once script to be added to migration system
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text, 
    'manual-fix-shop-schema', 
    CURRENT_TIMESTAMP, 
    '20250420000000_add_shop_fields', 
    'Applied manually via SQL script to fix schema mismatch', 
    NULL, 
    CURRENT_TIMESTAMP, 
    1
) ON CONFLICT DO NOTHING; 