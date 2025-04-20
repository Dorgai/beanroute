#!/bin/sh
set -e

echo "=== Starting BeanRoute with Database Migration Fix ==="
echo "Node version: $(node --version)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Ensure prisma directory exists
mkdir -p ./prisma

# Check if schema.prisma exists in the prisma directory
if [ ! -f ./prisma/schema.prisma ]; then
  echo "ERROR: schema.prisma is missing in the prisma directory!"
  
  # Try to find it in other locations
  if [ -f ./schema.prisma ]; then
    echo "Found schema.prisma in root directory, copying to prisma/..."
    cp -f ./schema.prisma ./prisma/schema.prisma
  else
    echo "ERROR: Could not find schema.prisma in any location!"
    exit 1
  fi
fi

echo "Prisma schema found at ./prisma/schema.prisma"

# Run the database initialization with migration fixes
echo "Running database initialization..."
node init-db.js

echo "Starting Next.js server..."
# Start the Next.js server with the proper port
exec next start -p ${PORT:-3000}
