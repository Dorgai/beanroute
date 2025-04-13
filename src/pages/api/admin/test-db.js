import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Print the environment variables for debugging (excluding sensitive values)
    console.log('DATABASE_URL structure:', process.env.DATABASE_URL?.substring(0, process.env.DATABASE_URL.indexOf('@')) + '@[REDACTED]');
    
    // Try a simple database query
    console.log('Trying to connect to the database...');
    const result = await prisma.$queryRaw`SELECT current_timestamp as time`;
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      timestamp: result[0]?.time || new Date(),
      env: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
} 