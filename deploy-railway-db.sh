#!/bin/bash

# Exit on error
set -e

echo "Starting database deployment script..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database if needed (optional)
# echo "Seeding the database..."
# npx prisma db seed

echo "Database deployment completed successfully!" 