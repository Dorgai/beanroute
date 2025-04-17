-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OWNER', 'RETAILER', 'ROASTER', 'BARISTA');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CoffeeGrade" AS ENUM ('SPECIALTY', 'PREMIUM', 'RARITY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BARISTA',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "UserShop" (
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BARISTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShop_pkey" PRIMARY KEY ("userId","shopId")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeam" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreenCoffee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" "CoffeeGrade" NOT NULL,
    "country" TEXT,
    "producer" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "GreenCoffee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreenCoffeeInventoryLog" (
    "id" TEXT NOT NULL,
    "coffeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeAmount" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreenCoffeeInventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailOrder" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderedById" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "coffeeId" TEXT NOT NULL,
    "smallBags" INTEGER NOT NULL DEFAULT 0,
    "largeBags" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailInventory" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "coffeeId" TEXT NOT NULL,
    "smallBags" INTEGER NOT NULL DEFAULT 0,
    "largeBags" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" DOUBLE PRECISION NOT NULL,
    "lastOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_name_key" ON "Shop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_userId_resource_action_key" ON "Permission"("userId", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_action_idx" ON "UserActivity"("action");

-- CreateIndex
CREATE INDEX "UserActivity_resource_idx" ON "UserActivity"("resource");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GreenCoffee_name_country_producer_key" ON "GreenCoffee"("name", "country", "producer");

-- CreateIndex
CREATE INDEX "RetailOrder_shopId_idx" ON "RetailOrder"("shopId");

-- CreateIndex
CREATE INDEX "RetailOrder_orderedById_idx" ON "RetailOrder"("orderedById");

-- CreateIndex
CREATE INDEX "RetailOrder_status_idx" ON "RetailOrder"("status");

-- CreateIndex
CREATE INDEX "RetailOrder_createdAt_idx" ON "RetailOrder"("createdAt");

-- CreateIndex
CREATE INDEX "RetailOrderItem_orderId_idx" ON "RetailOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "RetailOrderItem_coffeeId_idx" ON "RetailOrderItem"("coffeeId");

-- CreateIndex
CREATE INDEX "RetailInventory_shopId_idx" ON "RetailInventory"("shopId");

-- CreateIndex
CREATE INDEX "RetailInventory_coffeeId_idx" ON "RetailInventory"("coffeeId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailInventory_shopId_coffeeId_key" ON "RetailInventory"("shopId", "coffeeId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenCoffee" ADD CONSTRAINT "GreenCoffee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenCoffeeInventoryLog" ADD CONSTRAINT "GreenCoffeeInventoryLog_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "GreenCoffee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenCoffeeInventoryLog" ADD CONSTRAINT "GreenCoffeeInventoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "GreenCoffee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailInventory" ADD CONSTRAINT "RetailInventory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailInventory" ADD CONSTRAINT "RetailInventory_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "GreenCoffee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
