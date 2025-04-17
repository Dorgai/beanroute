import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify that the request comes from an authenticated user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow admin and owner to access all logs
    const isAdminOrOwner = ['ADMIN', 'OWNER'].includes(user.role);
    
    if (!isAdminOrOwner) {
      return res.status(403).json({ error: 'Access denied. Only administrators and owners can access alert logs.' });
    }

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

    // Get inventory check schedule settings if available
    const settings = await prisma.systemSettings.findUnique({
      where: { key: 'inventoryCheckSchedule' },
    });

    return res.status(200).json({ 
      success: true, 
      logs,
      settings,
    });
  } catch (error) {
    console.error('Error fetching alert logs:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 