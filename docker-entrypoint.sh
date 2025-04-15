#!/bin/bash

# Exit on error
set -e

echo "Starting application deployment..."

# Use the public database URL if available
if [ -n "$DATABASE_PUBLIC_URL" ]; then
  echo "Using public database URL..."
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm run start:server 