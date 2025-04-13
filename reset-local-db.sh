#!/bin/bash

# Reset and recreate Prisma migrations for local development
echo "Resetting local database migrations..."

# Define local database URL
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL service is not running. Starting it..."
    brew services start postgresql
    sleep 3  # Give it a moment to start
fi

# Create database if it doesn't exist
echo "Ensuring database exists..."
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='user_management'" | grep -q 1 || createdb -U postgres user_management

# Remove existing migrations
echo "Removing existing migrations..."
rm -rf prisma/migrations

# Create new migration with explicit database URL
echo "Creating new migration..."
DATABASE_URL="$LOCAL_DB_URL" npx prisma migrate dev --name init

# Generate Prisma client
echo "Generating Prisma client..."
DATABASE_URL="$LOCAL_DB_URL" npx prisma generate

echo "Database reset complete!"
echo "To start your app with local configuration, run: npm run start:dev" 