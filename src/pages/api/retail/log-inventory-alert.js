import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify that the request comes from an authenticated user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      shopId, 
      alertType, 
      totalSmallBags, 
      totalLargeBags, 
      minSmallBags, 
      minLargeBags, 
      smallBagsPercentage, 
      largeBagsPercentage,
      notifiedUserIds = []
    } = req.body;

    if (!shopId || !alertType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create an inventory alert log entry
    const alertLog = await prisma.inventoryAlertLog.create({
      data: {
        shopId,
        alertType,
        totalSmallBags,
        totalLargeBags,
        minSmallBags,
        minLargeBags,
        smallBagsPercentage,
        largeBagsPercentage,
        loggedById: user.id,
        notifiedUsers: {
          connect: notifiedUserIds.map(id => ({ id }))
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      alertLog,
      message: 'Alert logged successfully' 
    });
  } catch (error) {
    console.error('Error in log-inventory-alert:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 