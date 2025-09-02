-- Add missing fields to PushSubscription table
ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "limited" BOOLEAN DEFAULT false;
ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "mobile" BOOLEAN DEFAULT false;
ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "lastUsed" TIMESTAMP(3);
ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
