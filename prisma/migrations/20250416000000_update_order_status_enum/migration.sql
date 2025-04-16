-- First, create a temporary type with all the values we want
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- First modify the default value to NULL temporarily
ALTER TABLE "RetailOrder" ALTER COLUMN status DROP DEFAULT;

-- Update the column to use the new type
ALTER TABLE "RetailOrder" ALTER COLUMN status TYPE "OrderStatus_new" USING (
  CASE status::text
    WHEN 'PENDING' THEN 'PENDING'::text
    WHEN 'CONFIRMED' THEN 'CONFIRMED'::text
    WHEN 'CANCELLED' THEN 'CANCELLED'::text
    WHEN 'COMPLETED' THEN 'DELIVERED'::text -- Map COMPLETED to DELIVERED
    ELSE 'PENDING'::text
  END
)::text::"OrderStatus_new";

-- Drop the old type
DROP TYPE "OrderStatus";

-- Rename the new type to the old name
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- Restore the default value
ALTER TABLE "RetailOrder" ALTER COLUMN status SET DEFAULT 'PENDING'::"OrderStatus"; 