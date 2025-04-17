#!/bin/bash

# Comprehensive script to fix database and authentication issues
echo "🔄 Starting complete fix for BeanRoute..."

# Define colors for better visibility
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Define database connection string
DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Generate a secure JWT secret key
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}Generated JWT secret for secure authentication${NC}"

# Create all the necessary environment files
echo -e "${YELLOW}Creating environment files...${NC}"

# 1. Create .env file
cat > .env << EOF
# Main environment file
DATABASE_URL="${DB_URL}"
NODE_ENV="development"
SEED_DATABASE="true"
JWT_SECRET="${JWT_SECRET}"
COOKIE_SECURE="false"
COOKIE_SAMESITE="lax"
EOF

# 2. Create .env.development file for Next.js
cat > .env.development << EOF
# Next.js automatically loads this in development
DATABASE_URL="${DB_URL}"
NODE_ENV="development"
SEED_DATABASE="true"
JWT_SECRET="${JWT_SECRET}"
COOKIE_SECURE="false"
COOKIE_SAMESITE="lax"
EOF

# 3. Create .env.local file (used by some scripts)
cat > .env.local << EOF
# Local environment variables
DATABASE_URL="${DB_URL}"
NODE_ENV="development"
SEED_DATABASE="true"
JWT_SECRET="${JWT_SECRET}"
COOKIE_SECURE="false"
COOKIE_SAMESITE="lax"
EOF

echo -e "${GREEN}✅ Environment files created successfully${NC}"

# Fix the Prisma client singleton implementation
echo -e "${YELLOW}Fixing Prisma client implementation...${NC}"

cat > src/lib/prisma.js << EOF
import { PrismaClient } from '@prisma/client';

// For debugging purposes, log the environment variables
console.log('Prisma initializing with:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Avoid multiple instances during hot reloads
// Use simple singleton pattern
let prisma;

if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    // In development, preserve connection across hot reloads
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      });
    }
    prisma = global.prisma;
  }
}

export default prisma;
EOF

echo -e "${GREEN}✅ Prisma client fixed${NC}"

# Fix authentication implementation 
echo -e "${YELLOW}Fixing authentication implementation...${NC}"

# Update JWT cookie settings
cat > src/lib/cookie-config.js << EOF
// Cookie configuration for authentication
export const cookieConfig = {
  // In development, use non-secure cookies
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};
EOF

echo -e "${GREEN}✅ Authentication configuration fixed${NC}"

# Initialize database and run migrations
echo -e "${YELLOW}Initializing database...${NC}"

# Make sure the database exists
echo "Checking PostgreSQL connection and database existence..."
psql -h localhost -U postgres -c "SELECT 1" > /dev/null 2>&1 || { 
  echo -e "${RED}Cannot connect to PostgreSQL. Make sure it's running.${NC}"; 
  exit 1; 
}

psql -h localhost -U postgres -c "SELECT 1 FROM pg_database WHERE datname='user_management'" | grep -q 1 || {
  echo "Creating database user_management..."
  createdb -h localhost -U postgres user_management
}

# Run migrations with explicit DATABASE_URL
echo "Running database migrations..."
DATABASE_URL="${DB_URL}" npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
DATABASE_URL="${DB_URL}" npx prisma generate

# Seed database
echo "Seeding database with initial data..."
DATABASE_URL="${DB_URL}" npx prisma db seed

echo -e "${GREEN}✅ Database setup complete${NC}"

# Start the application
echo -e "${YELLOW}Starting application on port 3001...${NC}"
echo -e "${GREEN}Access your application at: http://localhost:3001${NC}"

# Start with explicit environment variables to make sure they're loaded
PORT=3001 DATABASE_URL="${DB_URL}" JWT_SECRET="${JWT_SECRET}" npx next dev -p 3001 