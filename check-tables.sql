-- First check if we can connect
SELECT 1 AS connection_test;

-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count records in each important table
SELECT 'User' AS table_name, COUNT(*) AS record_count FROM "User"
UNION ALL
SELECT 'Shop', COUNT(*) FROM "Shop"
UNION ALL
SELECT 'Team', COUNT(*) FROM "Team"
UNION ALL
SELECT 'UserShop', COUNT(*) FROM "UserShop"
UNION ALL
SELECT 'UserTeam', COUNT(*) FROM "UserTeam"
UNION ALL
SELECT 'Permission', COUNT(*) FROM "Permission"
UNION ALL
SELECT 'Session', COUNT(*) FROM "Session"
UNION ALL
SELECT 'UserActivity', COUNT(*) FROM "UserActivity"
UNION ALL
SELECT 'GreenCoffee', COUNT(*) FROM "GreenCoffee"
UNION ALL
SELECT 'GreenCoffeeInventoryLog', COUNT(*) FROM "GreenCoffeeInventoryLog"
UNION ALL
SELECT 'RetailOrder', COUNT(*) FROM "RetailOrder"
UNION ALL
SELECT 'RetailOrderItem', COUNT(*) FROM "RetailOrderItem"
UNION ALL
SELECT 'RetailInventory', COUNT(*) FROM "RetailInventory"
ORDER BY table_name; 