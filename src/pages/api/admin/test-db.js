import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Get environment details
    const nodeEnv = process.env.NODE_ENV || 'unknown';
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const directDbUrl = process.env.DIRECT_DATABASE_URL || 'not set';
    
    // Mask sensitive parts of the connection strings
    const maskDbUrl = dbUrl.replace(/postgres:\/\/([^:]+):([^@]+)@/, 'postgres://$1:********@');
    const maskDirectDbUrl = directDbUrl.replace(/postgres:\/\/([^:]+):([^@]+)@/, 'postgres://$1:********@');
    
    console.log('Trying to connect to the database...');
    console.log('DATABASE_URL:', maskDbUrl);
    console.log('NODE_ENV:', nodeEnv);
    
    // Try a simple database query
    let result;
    let connected = false;
    
    try {
      result = await prisma.$queryRaw`SELECT current_timestamp as time, current_database() as db_name, version() as pg_version`;
      connected = true;
    } catch (dbError) {
      console.error('Query error:', dbError);
      result = [{
        time: new Date(),
        error: dbError.message
      }];
    }
    
    return res.status(connected ? 200 : 500).json({
      success: connected,
      message: connected ? 'Database connection successful' : 'Database connection failed',
      timestamp: result[0]?.time || new Date(),
      database: result[0]?.db_name,
      version: result[0]?.pg_version,
      environment: {
        nodeEnv,
        databaseUrl: maskDbUrl,
        directDatabaseUrl: maskDirectDbUrl,
        hostname: process.env.HOSTNAME || 'unknown',
        platform: process.platform,
        nodeVersion: process.version
      },
      error: connected ? null : result[0]?.error
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