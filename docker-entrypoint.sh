#!/bin/sh

echo "Starting application in Docker container..."
echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

# Copy DATABASE_URL to DIRECT_DATABASE_URL if not set
if [ -z "$DIRECT_DATABASE_URL" ]; then
  echo "DIRECT_DATABASE_URL not set. Using DATABASE_URL as DIRECT_DATABASE_URL."
  export DIRECT_DATABASE_URL="$DATABASE_URL"
fi

# Check if prisma directory exists
if [ ! -d "./prisma" ]; then
  echo "ERROR: prisma directory not found."
  exit 1
fi

echo "Prisma directory contents:"
ls -la ./prisma

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "Applying database migrations..."
npx prisma migrate deploy || {
  echo "⚠️ Migration failed. Database might not be fully set up."
  echo "⚠️ Continuing anyway... Some features may not work."
}

# Start the application
echo "Starting the application..."
node server.js 