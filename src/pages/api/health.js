import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as result`;
    const dbConnected = dbTest && dbTest.length > 0 && dbTest[0].result === 1;
    
    // Count users to check if we have seed data
    const userCount = await prisma.user.count();
    
    // Check environment variables
    const jwtSecretSet = !!process.env.JWT_SECRET;
    
    return res.status(200).json({
      status: 'ok',
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
      database: {
        connected: dbConnected,
        userCount,
      },
      config: {
        jwtSecretSet,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
} 