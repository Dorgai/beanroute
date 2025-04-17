#!/usr/bin/env node

// Direct script to initialize and test database connectivity

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Display environment info
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//******:******@') : 
  'Not defined');
console.log('NODE_ENV:', process.env.NODE_ENV);

async function main() {
  try {
    // Run migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Test connection
    console.log('Testing database connection...');
    const prisma = new PrismaClient();
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Database connection successful. Found ${userCount} users.`);
    
    if (process.env.SEED_DATABASE === 'true') {
      console.log('Seeding database...');
      execSync('npx prisma db seed', { stdio: 'inherit' });
    }
    
    await prisma.$disconnect();
    console.log('Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
} 