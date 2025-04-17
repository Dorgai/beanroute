#!/bin/bash

# Script to check tables in Railway PostgreSQL database
echo "Checking tables in Railway PostgreSQL database..."

# Function to extract host, username, password, port and database from a PostgreSQL URL
function extract_pg_params() {
  local url=$1
  local username=$(echo $url | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  local password=$(echo $url | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
  local host_port=$(echo $url | sed -n 's/.*@\([^/]*\).*/\1/p')
  local host=$(echo $host_port | cut -d':' -f1)
  local port=$(echo $host_port | cut -d':' -f2)
  local dbname=$(echo $url | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  echo "$username $password $host $port $dbname"
}

# Check that the DATABASE_URL environment variable is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  echo "Run this script with: railway run ./check-railway-tables.sh"
  exit 1
fi

# Extract database credentials
read -r PG_USER PG_PASS PG_HOST PG_PORT PG_DBNAME <<< $(extract_pg_params "$DATABASE_URL")

echo "Connecting to PostgreSQL at $PG_HOST:$PG_PORT"
echo "Database: $PG_DBNAME"
echo "User: $PG_USER"

# Create a temporary SQL file with our queries
cat > /tmp/check_tables.sql << EOF
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
EOF

# Run the SQL against the database
echo "Executing SQL queries..."
PGPASSWORD=$PG_PASS psql -h $PG_HOST -p $PG_PORT -d $PG_DBNAME -U $PG_USER -f /tmp/check_tables.sql

# Clean up
rm /tmp/check_tables.sql
echo "Check complete!" 