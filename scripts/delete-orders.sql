-- First, count the orders
SELECT COUNT(*) as order_count FROM "RetailOrder";

-- Count inventory records before deletion
SELECT COUNT(*) as inventory_count_before FROM "RetailInventory";

-- Delete order items first (due to foreign key constraints)
DELETE FROM "RetailOrderItem";

-- Delete orders
DELETE FROM "RetailOrder";

-- Verify orders are deleted
SELECT COUNT(*) as remaining_orders FROM "RetailOrder";

-- Verify inventory is intact
SELECT COUNT(*) as inventory_count_after FROM "RetailInventory"; 