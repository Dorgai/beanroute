#!/bin/bash

# Full reset of the BeanRoute application, including database
echo "🧹 Starting complete reset and rebuild of BeanRoute..."

# Define colors for better visibility
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define database connection string
DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Clear existing node modules and next cache
echo -e "${YELLOW}Cleaning up existing caches and build artifacts...${NC}"
rm -rf .next
rm -rf node_modules
rm -rf prisma/.env

# Kill any running node instances
echo -e "${YELLOW}Killing any running Node.js processes...${NC}"
pkill -f "node" || true

# Generate a secure JWT secret key
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}Generated new JWT secret: ${JWT_SECRET}${NC}"

# Complete database reset
echo -e "${BLUE}===== COMPLETELY RESETTING DATABASE =====${NC}"

# Drop database
echo "Dropping existing database..."
dropdb -h localhost -U postgres user_management --if-exists

# Recreate database
echo "Creating new database..."
createdb -h localhost -U postgres user_management

# Reset Prisma migrations
echo "Removing old migrations..."
rm -rf prisma/migrations

# Clear all environment files and recreate them
echo -e "${YELLOW}Recreating all environment files...${NC}"

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

# Fix the Prisma client implementation for better reliability
echo -e "${YELLOW}Updating Prisma client implementation...${NC}"

cat > src/lib/prisma.js << EOF
import { PrismaClient } from '@prisma/client';

// Debug logging for Prisma initialization
console.log('[Prisma] Initializing with: NODE_ENV =', process.env.NODE_ENV);
console.log('[Prisma] DATABASE_URL exists =', !!process.env.DATABASE_URL);

// In production, always create a new client
// In development, use global to preserve across hot reloads
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Only save to global in development to prevent memory leaks in production
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
EOF

echo -e "${GREEN}✅ Prisma client implementation fixed${NC}"

# Reinstall dependencies
echo -e "${YELLOW}Reinstalling dependencies...${NC}"
npm install

# Initialize Prisma
echo -e "${YELLOW}Initializing fresh Prisma setup...${NC}"
npx prisma generate

# Create new migrations
echo -e "${YELLOW}Creating new database migrations...${NC}"
DATABASE_URL="${DB_URL}" npx prisma migrate dev --name init

# Seed the database
echo -e "${YELLOW}Seeding the database with fresh data...${NC}"
DATABASE_URL="${DB_URL}" npx prisma db seed

echo -e "${GREEN}✅ Database has been completely reset and reseeded${NC}"

# Create a test API endpoint to verify database connection
echo -e "${YELLOW}Creating test database endpoint...${NC}"

mkdir -p src/pages/api/test
cat > src/pages/api/test/db-connection.js << EOF
// Test endpoint for database connection
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL exists =', !!process.env.DATABASE_URL);
  console.log('NODE_ENV =', process.env.NODE_ENV);

  try {
    // Create a fresh Prisma client directly in this file
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Run a simple query to verify connection
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      }
    });
    
    await prisma.$disconnect();
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
EOF

echo -e "${GREEN}✅ Test endpoint created at /api/test/db-connection${NC}"

# Start the application
echo -e "${BLUE}===== STARTING APPLICATION =====${NC}"
echo -e "${GREEN}Access your application at: http://localhost:3001${NC}"
echo -e "${GREEN}Test database connection at: http://localhost:3001/api/test/db-connection${NC}"

# Start with explicit environment variables
DATABASE_URL="${DB_URL}" JWT_SECRET="${JWT_SECRET}" npx next dev -p 3001 