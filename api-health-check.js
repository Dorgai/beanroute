// API Health Check script
const { PrismaClient } = require('@prisma/client');

async function checkHealth() {
  console.log('Running API health check...');
  
  try {
    // Create Prisma client
    const prisma = new PrismaClient();
    
    // Check database connection
    console.log('Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful!');
    
    // Return health status
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'unknown'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'unknown'
    };
  }
}

module.exports = { checkHealth }; 