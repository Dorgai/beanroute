#!/bin/bash

# Setup local PostgreSQL database for development
echo "Setting up local PostgreSQL database for user management system..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first."
    echo "You can install it using Homebrew: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL service is not running. Starting it..."
    brew services start postgresql
    sleep 3  # Give it a moment to start
fi

# Create database and user
echo "Creating database user_management..."
createdb user_management 2>/dev/null || echo "Database already exists"

# Update .env.local
echo "Creating .env.local file with local database configuration..."
cat > .env.local << EOF
# Local development environment variables
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/user_management"
# No need for DIRECT_DATABASE_URL in local development
NODE_ENV="development"
EOF

echo "Setting up Prisma..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate dev --name init

echo "Seeding database..."
npx prisma db seed

echo "Local database setup complete!"
echo "To use local configuration, run the app with: NODE_ENV=development npm run dev" 