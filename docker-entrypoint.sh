#!/bin/sh

echo "Starting application in Docker container..."
echo "Current directory: $(pwd)"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

# Install PostgreSQL client for database setup
echo "Installing PostgreSQL client..."
apk add --no-cache postgresql-client

# Deploy database schema using our dedicated script
echo "Deploying database schema..."
./deploy-db.sh "$DATABASE_URL" || {
  echo "⚠️ Database schema deployment might not be complete."
  echo "⚠️ Continuing anyway... Some features may not work."
}

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || {
  echo "⚠️ Prisma client generation failed."
  echo "⚠️ Continuing anyway... Some features may not work."
}

# Start the application
echo "Starting the application..."
node server.js 