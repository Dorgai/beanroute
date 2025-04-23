#!/bin/bash
set -e

echo "=== Starting BeanRoute Application ==="

# Configure database connections for Railway
echo "Configuring database connections..."
node railway-db-config.js

# Check database connection
echo "Checking database connection..."
node api-health-check.js

# Initialize the database
echo "Initializing database..."
node init-railway-db.js

# Start the server
echo "Starting server..."
exec node server.js
