// Test database connectivity with verbose logging
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log('====== DATABASE CONNECTION TEST ======');
  console.log('Environment variables:');
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    const sanitizedUrl = process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
    console.log('- DATABASE_URL:', sanitizedUrl);
  }
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  try {
    // Create a new PrismaClient instance directly in this file
    console.log('Creating new PrismaClient instance...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('Attempting database query...');
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Query successful! Found ${userCount} users.`);
    
    // Disconnect when done
    await prisma.$disconnect();
    console.log('Disconnected from database.');
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrlExists: !!process.env.DATABASE_URL,
      }
    });
  } catch (error) {
    console.error('DATABASE CONNECTION ERROR:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack,
      env: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrlExists: !!process.env.DATABASE_URL,
      }
    });
  }
} 