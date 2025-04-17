// Test endpoint for database connection - NO AUTHENTICATION REQUIRED
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL exists =', !!process.env.DATABASE_URL);
  
  // Print the masked URL for debugging (hide credentials)
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(
      /postgresql:\/\/([^:]+):([^@]+)@/,
      'postgresql://$1:****@'
    );
    console.log('DATABASE_URL (masked) =', maskedUrl);
  } else {
    console.log('DATABASE_URL is not defined!');
  }
  
  console.log('NODE_ENV =', process.env.NODE_ENV);

  try {
    // Create a fresh Prisma client directly in this file
    console.log('Creating new PrismaClient instance...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Run a simple query to verify connection
    console.log('Attempting to query database...');
    const userCount = await prisma.user.count();
    console.log(`Query successful! Found ${userCount} users.`);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      },
      take: 5
    });
    
    await prisma.$disconnect();
    console.log('Database connection closed.');
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount,
      users,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrlExists: !!process.env.DATABASE_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrlExists: !!process.env.DATABASE_URL
      }
    });
  }
}
