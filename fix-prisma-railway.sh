#!/bin/bash
set -e

echo "=== Fixing Prisma Configuration for Railway ==="

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
    echo "Creating minimal schema.prisma file..."
    # Create a minimal schema file that can be used for initial connection
    cat > ./prisma/schema.prisma << 'END'
// This is a minimal Prisma schema file generated automatically
// For more information about Prisma, see: https://pris.ly/d/getting-started

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
END
  fi
fi

# Run prisma generate to create the client
echo "Running prisma generate..."
npx prisma generate

echo "Prisma configuration fixed successfully." 