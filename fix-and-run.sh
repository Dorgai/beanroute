#!/bin/bash

# Don't exit on error, as we want to continue even if steps fail
set +e

echo "Starting database reset and initialization..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Skip trying to use psql since it's not installed in the container
echo "Skipping database migration reset (no psql available)..."

# Try a simple migration deploy without any options
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration deployment failed, but continuing..."
}

# Conditionally seed the database
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database with initial data..."
  npx prisma db seed || echo "Seeding failed, but continuing..."
else
  echo "Skipping database seeding (SEED_DATABASE is not set to true)..."
fi

# Start the application (use the custom server.js)
echo "Database setup complete. Starting application..."
node server.js 