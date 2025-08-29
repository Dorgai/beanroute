import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[api/retail/alert-logs] Starting alert logs fetch');
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify that the request comes from an authenticated user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      console.log('[api/retail/alert-logs] Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[api/retail/alert-logs] User authenticated:', user.role);

    // Only allow admin and owner to access all logs
    const isAdminOrOwner = ['ADMIN', 'OWNER'].includes(user.role);
    
    if (!isAdminOrOwner) {
      console.log('[api/retail/alert-logs] Access denied for role:', user.role);
      return res.status(403).json({ error: 'Access denied. Only administrators and owners can access alert logs.' });
    }

    // Check database connectivity first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[api/retail/alert-logs] Database connection verified');
    } catch (dbError) {
      console.error('[api/retail/alert-logs] Database connection error:', dbError);
      return res.status(500).json({ error: 'Database connection error', details: dbError.message });
    }

    console.log('[api/retail/alert-logs] Fetching alert logs from database');
    
    // Get all alert logs with shop details and notified users
    const logs = await prisma.inventoryAlertLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
        loggedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        notifiedUsers: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      take: 100, // Limit to 100 most recent logs
    });

    console.log(`[api/retail/alert-logs] Found ${logs.length} alert logs`);

    // Get inventory check schedule settings if available
    const settings = await prisma.systemSettings.findUnique({
      where: { key: 'inventoryCheckSchedule' },
    });

    console.log('[api/retail/alert-logs] Successfully returning alert logs');
    
    return res.status(200).json({ 
      success: true, 
      logs,
      settings,
    });
  } catch (error) {
    console.error('[api/retail/alert-logs] Error fetching alert logs:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 