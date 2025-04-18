const { PrismaClient } = require('@prisma/client');

// Create a custom Prisma client with logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log queries for debugging
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

async function checkDatabase() {
  console.log('Starting database check...');
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connection successful.');

    // Check if essential tables exist
    console.log('\nChecking database tables...');
    
    // Try to fetch one user to verify User table exists
    try {
      const userCount = await prisma.user.count();
      console.log(`✓ User table exists with ${userCount} records`);
    } catch (e) {
      console.error('✗ User table not found or has issues:', e.message);
    }
    
    // Try to fetch one shop to verify Shop table exists
    try {
      const shopCount = await prisma.shop.count();
      console.log(`✓ Shop table exists with ${shopCount} records`);
    } catch (e) {
      console.error('✗ Shop table not found or has issues:', e.message);
    }
    
    // Check if any orders exist
    try {
      const orderCount = await prisma.retailOrder.count();
      console.log(`✓ RetailOrder table exists with ${orderCount} records`);
    } catch (e) {
      console.error('✗ RetailOrder table not found or has issues:', e.message);
    }
    
    // Check migrations table if it exists
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) FROM _prisma_migrations`;
      console.log(`✓ _prisma_migrations table exists with ${result[0].count} migrations`);
    } catch (e) {
      console.log('✗ _prisma_migrations table not found. Database may not be using Prisma migrations.');
    }

    console.log('\nDatabase check complete.');
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 