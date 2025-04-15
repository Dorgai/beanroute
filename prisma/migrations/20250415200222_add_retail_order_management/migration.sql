-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

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
