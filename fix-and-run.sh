#!/bin/bash

# Exit on error
set -e

echo "Starting database reset and initialization..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Reset the database (drop all tables and recreate schema)
echo "Resetting database - this will drop all tables and recreate schema..."
npx prisma migrate reset --force

# Run migrations to create schema
echo "Running database migrations..."
npx prisma migrate deploy

# Conditionally seed the database
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database with initial data..."
  npx prisma db seed
else
  echo "Skipping database seeding (SEED_DATABASE is not set to true)..."
fi

# Start the application
echo "Database setup complete. Starting application..."
npm start 