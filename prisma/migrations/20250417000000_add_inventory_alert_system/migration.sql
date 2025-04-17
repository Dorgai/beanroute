-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);

-- Create InventoryAlertLog table
CREATE TABLE IF NOT EXISTS "InventoryAlertLog" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "alertType" TEXT NOT NULL,
  "totalSmallBags" INTEGER NOT NULL,
  "totalLargeBags" INTEGER NOT NULL,
  "minSmallBags" INTEGER NOT NULL,
  "minLargeBags" INTEGER NOT NULL,
  "smallBagsPercentage" DOUBLE PRECISION NOT NULL,
  "largeBagsPercentage" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "loggedById" TEXT NOT NULL,
  "emailsSent" BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT "InventoryAlertLog_pkey" PRIMARY KEY ("id")
);

-- Create many-to-many relationship table for alert notifications
CREATE TABLE IF NOT EXISTS "_AlertNotifications" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

-- Create unique index on the combination of A and B for AlertNotifications
CREATE UNIQUE INDEX "_AlertNotifications_AB_unique" ON "_AlertNotifications"("A", "B");
CREATE INDEX "_AlertNotifications_B_index" ON "_AlertNotifications"("B");

-- Add foreign key constraints
ALTER TABLE "InventoryAlertLog" ADD CONSTRAINT "InventoryAlertLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAlertLog" ADD CONSTRAINT "InventoryAlertLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add many-to-many relationship constraints
ALTER TABLE "_AlertNotifications" ADD CONSTRAINT "_AlertNotifications_A_fkey" FOREIGN KEY ("A") REFERENCES "InventoryAlertLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AlertNotifications" ADD CONSTRAINT "_AlertNotifications_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 