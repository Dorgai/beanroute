#!/bin/bash

# Exit on error
set -e

echo "Starting application deployment..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
npm run start:server 