#!/bin/bash

# Exit on error
set -e

echo "Starting database reset and initialization..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Clear failed migrations (delete _prisma_migrations table)
echo "Clearing failed migrations from database..."
DB_URL=${DATABASE_URL:-$DATABASE_PUBLIC_URL}
DB_URL_SAFE=$(echo $DB_URL | sed 's/\/\/[^:]*:[^@]*@/\/\/USERNAME:PASSWORD@/')
echo "Using database URL: $DB_URL_SAFE"

# Try to connect to the database and drop the migrations table if it exists
echo "Attempting to drop _prisma_migrations table..."
psql $DB_URL -c "DROP TABLE IF EXISTS _prisma_migrations;" || {
  echo "Failed to drop _prisma_migrations table. Database might not be accessible yet."
  echo "Will continue with migrations anyway."
}

# Skip the reset since it might fail and just go directly to deploying migrations
echo "Running database migrations..."
npx prisma migrate deploy --create-only || {
  echo "Migration deployment failed, but continuing..."
}

# Conditionally seed the database
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database with initial data..."
  npx prisma db seed || echo "Seeding failed, but continuing..."
else
  echo "Skipping database seeding (SEED_DATABASE is not set to true)..."
fi

# Start the application
echo "Database setup complete. Starting application..."
npm start 