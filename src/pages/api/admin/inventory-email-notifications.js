import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { wrapApiHandler } from '@/lib/safe-api-wrapper';

async function inventoryEmailNotificationsHandler(req, res) {
  try {
    // Handle authentication - hybrid approach for API tokens and browser sessions
    let user;
    try {
      user = await verifyRequestAndGetUser(req);
      if (!user) {
        const session = await getServerSession({ req, res });
        if (session && session.user) {
          user = session.user;
        }
      }
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (authError) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or Owner role required.' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[inventory-email-notifications] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

async function handleGet(req, res, user) {
  try {
    console.log('[inventory-email-notifications] Handling GET request');

    // Fetch all inventory email notifications
    const notifications = await prisma.inventoryEmailNotification.findMany({
      include: {
        shop: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { shop: { name: 'asc' } },
        { alertType: 'asc' }
      ]
    });

    // Get all shops for the dropdown
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });

    // Get creators for display
    const creators = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'OWNER'] }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`[inventory-email-notifications] Found ${notifications.length} notifications and ${shops.length} shops`);

    return res.status(200).json({
      success: true,
      notifications,
      shops,
      creators
    });
  } catch (error) {
    console.error('[inventory-email-notifications] Error fetching notifications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inventory email notifications',
      details: error.message
    });
  }
}

async function handlePost(req, res, user) {
  try {
    console.log('[inventory-email-notifications] Creating new inventory email notification');
    
    const { shopId, alertType = 'ALL', emails, isEnabled = true } = req.body;

    // Validate required fields
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ 
        error: 'Missing required fields: emails array is required' 
      });
    }

    // Validate alert type
    const validAlertTypes = ['WARNING', 'CRITICAL', 'ALL'];
    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({ 
        error: 'Invalid alert type',
        validAlertTypes
      });
    }

    // Validate emails
    const validEmails = emails.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email && typeof email === 'string' && emailRegex.test(email.trim());
    });

    if (validEmails.length === 0) {
      return res.status(400).json({ 
        error: 'At least one valid email address is required' 
      });
    }

    // Check if shop exists (if shopId provided)
    if (shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, name: true }
      });

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }
    }

    // Check if notification for this shop and alert type already exists
    const existingNotification = await prisma.inventoryEmailNotification.findUnique({
      where: {
        shopId_alertType: {
          shopId: shopId || null,
          alertType
        }
      }
    });

    if (existingNotification) {
      const scopeText = shopId ? `shop and alert type ${alertType}` : `global alert type ${alertType}`;
      return res.status(409).json({ 
        error: `Inventory email notification for ${scopeText} already exists. Use PUT to update it.` 
      });
    }

    // Create the notification
    const notification = await prisma.inventoryEmailNotification.create({
      data: {
        shopId: shopId || null,
        alertType,
        emails: validEmails,
        isEnabled,
        createdById: user.id
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const scopeText = shopId ? `shop and alert type ${alertType}` : `global alert type ${alertType}`;
    console.log(`[inventory-email-notifications] Created notification for ${scopeText}`);

    return res.status(201).json({
      success: true,
      message: 'Inventory email notification created successfully',
      notification
    });
  } catch (error) {
    console.error('[inventory-email-notifications] Error creating notification:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Inventory email notification for this shop and alert type already exists' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create inventory email notification',
      details: error.message
    });
  }
}

export default wrapApiHandler(inventoryEmailNotificationsHandler);
