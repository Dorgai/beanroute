import { PrismaClient } from '@prisma/client';

// Simple health check endpoint for Railway
export default async function handler(req, res) {
  const prisma = new PrismaClient();
  
  try {
    // Check database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    // Return health status with timestamp
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return unhealthy status with error details
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'unknown'
    });
  } finally {
    await prisma.$disconnect();
  }
} 