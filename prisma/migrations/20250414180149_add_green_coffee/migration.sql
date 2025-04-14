-- CreateEnum
CREATE TYPE "CoffeeGrade" AS ENUM ('SPECIALTY', 'PREMIUM', 'RARITY');

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

-- CreateIndex
CREATE UNIQUE INDEX "GreenCoffee_name_country_producer_key" ON "GreenCoffee"("name", "country", "producer");

-- AddForeignKey
ALTER TABLE "GreenCoffee" ADD CONSTRAINT "GreenCoffee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenCoffeeInventoryLog" ADD CONSTRAINT "GreenCoffeeInventoryLog_coffeeId_fkey" FOREIGN KEY ("coffeeId") REFERENCES "GreenCoffee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenCoffeeInventoryLog" ADD CONSTRAINT "GreenCoffeeInventoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
