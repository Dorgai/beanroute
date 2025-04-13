#!/bin/bash

# Force the use of local database by temporarily updating .env
echo "Forcing use of local database..."

# Define local database URL
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Back up the current .env file
echo "Backing up current .env file..."
cp .env .env.backup

# Update .env with local database URL
echo "Updating .env with local database URL..."
cat > .env << EOF
DATABASE_URL="$LOCAL_DB_URL"
NODE_ENV="development"
# DIRECT_DATABASE_URL is not needed for local development
EOF

echo "Creating database if it doesn't exist..."
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='user_management'" | grep -q 1 || createdb -U postgres user_management

# Remove existing migrations if needed
if [ "$1" == "--reset" ]; then
  echo "Removing existing migrations..."
  rm -rf prisma/migrations
fi

# Create and migrate the database
echo "Creating and migrating database..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# If user provided seed flag, run seed script
if [ "$1" == "--seed" ] || [ "$2" == "--seed" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

# Restore the original .env file
echo "Restoring original .env file..."
mv .env.backup .env

echo "Local database setup complete!"
echo "To run your app with the local database, use:"
echo "DATABASE_URL=\"$LOCAL_DB_URL\" npm run dev" 