import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    let dbConnected = false;
    let userCount = 0;
    
    try {
      // Test database connection
      const dbTest = await prisma.$queryRaw`SELECT 1 as result`;
      dbConnected = dbTest && dbTest.length > 0 && dbTest[0].result === 1;
      
      // Only count users if database is connected
      if (dbConnected) {
        userCount = await prisma.user.count();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // We won't fail the health check just because of DB issues
    }
    
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
    
    // Still return 200 OK for the healthcheck to pass
    // This prevents Railway from killing the service during startup
    return res.status(200).json({
      status: 'warning',
      message: 'Health check encountered errors but service is running',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
} 