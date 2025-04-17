import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import cookie from 'cookie';

// Enhanced health check with detailed diagnostics
export default async function handler(req, res) {
  console.log('Running enhanced health check');
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: false,
      tables: {},
      connection: process.env.DATABASE_URL ? 'configured' : 'missing',
      error: null
    },
    auth: {
      cookiePresent: false,
      cookieValue: null,
      parsedToken: null,
      validSession: false,
      error: null
    },
    request: {
      headers: req.headers,
      cookies: req.cookies
    }
  };

  // Test basic database connection
  const prisma = new PrismaClient();
  try {
    // Test simple query
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database.connected = true;
    
    // Count records in key tables
    try {
      diagnostics.database.tables.users = await prisma.user.count();
      diagnostics.database.tables.shops = await prisma.shop.count();
      diagnostics.database.tables.coffee = await prisma.greenCoffee.count();
      diagnostics.database.tables.inventory = await prisma.retailInventory.count();
      
      // Fetch one shop for diagnostic purposes
      if (diagnostics.database.tables.shops > 0) {
        const firstShop = await prisma.shop.findFirst({
          select: { id: true, name: true }
        });
        diagnostics.database.sampleShop = firstShop;
      }
    } catch (countError) {
      diagnostics.database.tableError = countError.message;
    }
  } catch (dbError) {
    diagnostics.database.connected = false;
    diagnostics.database.error = dbError.message;
  } finally {
    await prisma.$disconnect();
  }

  // Check auth status
  try {
    // Examine cookies
    if (req.headers.cookie) {
      const cookies = cookie.parse(req.headers.cookie);
      diagnostics.auth.cookiePresent = !!cookies.auth;
      diagnostics.auth.cookieValue = cookies.auth ? `${cookies.auth.substring(0, 10)}...` : null;
    }
    
    // Get session
    try {
      const session = await getServerSession(req, res);
      diagnostics.auth.validSession = !!session;
      if (session && session.user) {
        diagnostics.auth.user = {
          id: session.user.id,
          role: session.user.role
        };
      }
    } catch (sessionError) {
      diagnostics.auth.error = sessionError.message;
    }
  } catch (authError) {
    diagnostics.auth.error = authError.message;
  }

  // Return diagnostic information
  console.log('Health check diagnostics:', diagnostics);
  return res.status(200).json({
    status: 'ok',
    message: 'Health check completed',
    diagnostics
  });
} 