#!/bin/sh

set -e

echo "Database deployment script started..."

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if we need to seed the database
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding the database..."
  npx prisma db seed
else
  echo "Skipping database seed (SEED_DATABASE not set to 'true')"
fi

echo "Database deployment completed successfully!"
exit 0 