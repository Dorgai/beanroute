#!/bin/sh
set -e

echo "=== Starting BeanRoute with Database Migration Fix ==="
echo "Node version: $(node --version)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Run the database initialization with migration fixes
echo "Running database initialization..."
node init-db.js

echo "Starting Next.js server..."
# Start the Next.js server with the proper port
exec next start -p ${PORT:-8080}
