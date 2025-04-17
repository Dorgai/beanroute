import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// This endpoint can be called by a CRON job to schedule regular inventory checks
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify API key for CRON jobs or admin auth
    const apiKey = req.headers['x-api-key'];
    const isValidApiKey = apiKey && apiKey === process.env.INVENTORY_CHECK_API_KEY;
    
    let user = null;
    if (!isValidApiKey) {
      // If not using API key, validate user is admin/owner
      user = await verifyRequestAndGetUser(req);
      if (!user || !['ADMIN', 'OWNER'].includes(user.role)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Determine frequency from request or use default
    const { frequency = 'daily' } = req.body;
    const allowedFrequencies = ['hourly', 'daily', 'weekly'];
    
    if (!allowedFrequencies.includes(frequency)) {
      return res.status(400).json({ error: `Invalid frequency. Must be one of: ${allowedFrequencies.join(', ')}` });
    }

    // Store the schedule settings in the database
    const settings = await prisma.systemSettings.upsert({
      where: { key: 'inventoryCheckSchedule' },
      update: { 
        value: JSON.stringify({
          frequency,
          lastUpdated: new Date().toISOString(),
          updatedBy: user ? user.id : 'system'
        })
      },
      create: {
        key: 'inventoryCheckSchedule',
        value: JSON.stringify({
          frequency,
          lastUpdated: new Date().toISOString(),
          updatedBy: user ? user.id : 'system'
        })
      }
    });

    // Queue an immediate inventory check
    const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/retail/check-inventory-alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INVENTORY_CHECK_API_KEY
      }
    });

    const checkResult = await response.json();

    return res.status(200).json({ 
      success: true, 
      message: `Inventory check schedule updated to ${frequency}`,
      settings,
      lastCheck: checkResult
    });
  } catch (error) {
    console.error('Error in schedule-inventory-check:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 