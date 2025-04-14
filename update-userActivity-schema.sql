-- Add missing columns to UserActivity table
-- These will fail if columns already exist, which is fine
ALTER TABLE "UserActivity" ADD COLUMN "resource" TEXT DEFAULT 'USER';
ALTER TABLE "UserActivity" ADD COLUMN "resourceId" TEXT;
ALTER TABLE "UserActivity" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "UserActivity" ADD COLUMN "userAgent" TEXT;

-- Create indexes for better performance
CREATE INDEX "UserActivity_resource_idx" ON "UserActivity"("resource");
CREATE INDEX "UserActivity_resourceId_idx" ON "UserActivity"("resourceId");

-- Update existing records to have valid resource values
UPDATE "UserActivity" SET "resource" = 'USER' WHERE "resource" IS NULL; 