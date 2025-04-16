#!/bin/bash

# Exit on error, but not for the database migration
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

# Run database migrations with retry logic
echo "Running database migrations..."
MAX_RETRIES=5
RETRY_COUNT=0
RETRY_DELAY=10

until npx prisma migrate deploy || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Migration attempt $RETRY_COUNT of $MAX_RETRIES failed. Retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

# Continue even if migrations fail - the app will handle this gracefully
# thanks to our updated health check

# Start the application
echo "Starting the application..."
npm run start:server 