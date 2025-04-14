import prisma from '../../lib/prisma';

/**
 * Health Check API
 * 
 * Tests:
 * 1. Basic API functionality
 * 2. Database connectivity (if available)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Always return 200 for basic health check
  // This ensures the container stays alive even if the database is not yet ready
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'operational',
    environment: process.env.NODE_ENV || 'development',
    database: 'unknown'
  };

  try {
    // Test database connection by executing a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    if (result && result[0]?.test === 1) {
      healthStatus.database = 'connected';
    } else {
      healthStatus.database = 'abnormal_response';
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    healthStatus.database = 'disconnected';
    healthStatus.dbError = process.env.NODE_ENV === 'development' ? error.message : 'Database connection error';
  }

  // Always return 200 to pass Railway's health check
  return res.status(200).json(healthStatus);
} 