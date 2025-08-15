-- Drop existing tables if they exist
DROP TABLE IF EXISTS "UserActivity" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
DROP TABLE IF EXISTS "UserTeam" CASCADE;
DROP TABLE IF EXISTS "Team" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "TeamRole" CASCADE;

-- Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED');
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Create tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserTeam" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("userId","teamId")
);

CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "Permission_userId_resource_action_key" ON "Permission"("userId", "resource", "action");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- Add foreign key constraints
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create admin user if not exists
INSERT INTO "User" ("id", "username", "email", "password", "firstName", "lastName", "role", "status", "createdAt", "updatedAt") 
VALUES (
    'admin-user-id', 
    'admin', 
    'admin@example.com', 
    '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm', -- "secret" hashed with bcrypt
    'Admin', 
    'User', 
    'ADMIN', 
    'ACTIVE', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Update prisma migration table to mark this as migrated
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    'manual-migration-1', 
    'manual migration', 
    CURRENT_TIMESTAMP, 
    '20250413111911_init', 
    'Applied manually via SQL script', 
    NULL, 
    CURRENT_TIMESTAMP, 
    1
) ON CONFLICT DO NOTHING;

-- =========================================================================================
-- EMAIL NOTIFICATION SYSTEM - Added for order status change notifications
-- =========================================================================================

-- Create OrderEmailNotification table for managing email notifications on order status changes
CREATE TABLE IF NOT EXISTS "OrderEmailNotification" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "emails" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "OrderEmailNotification_pkey" PRIMARY KEY ("id")
);

-- Create indexes for OrderEmailNotification
CREATE INDEX IF NOT EXISTS "OrderEmailNotification_orderStatus_idx" ON "OrderEmailNotification"("orderStatus");
CREATE INDEX IF NOT EXISTS "OrderEmailNotification_shopId_idx" ON "OrderEmailNotification"("shopId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrderEmailNotification_shopId_orderStatus_key" ON "OrderEmailNotification"("shopId", "orderStatus");

-- Add foreign key constraints for OrderEmailNotification
ALTER TABLE "OrderEmailNotification" 
ADD CONSTRAINT "OrderEmailNotification_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderEmailNotification" 
ADD CONSTRAINT "OrderEmailNotification_shopId_fkey" 
FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add email notification relation to User table (already exists in schema, just documenting)
-- The User table now has: createdEmailNotifications OrderEmailNotification[] @relation("OrderEmailNotificationCreator")

-- Add email notification relation to Shop table (already exists in schema, just documenting)  
-- The Shop table now has: emailNotifications OrderEmailNotification[]

-- Insert migration record for email notification system
INSERT INTO "_prisma_migrations" (
    "id", 
    "checksum", 
    "finished_at", 
    "migration_name", 
    "logs", 
    "rolled_back_at", 
    "started_at", 
    "applied_steps_count"
) 
VALUES (
    'email-notification-migration-1', 
    'email notification system migration', 
    CURRENT_TIMESTAMP, 
    '20250417000000_add_order_email_notifications', 
    'Added OrderEmailNotification table for order status change email notifications', 
    NULL, 
    CURRENT_TIMESTAMP, 
    1
) ON CONFLICT DO NOTHING; 