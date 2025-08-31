import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Notification ID is required' });
  }

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
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id, user);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[inventory-email-notifications/id] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

async function handleGet(req, res, id) {
  try {
    console.log(`[inventory-email-notifications/id] Fetching notification: ${id}`);
    
    const notification = await prisma.inventoryEmailNotification.findUnique({
      where: { id },
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

    if (!notification) {
      return res.status(404).json({ error: 'Inventory email notification not found' });
    }

    console.log(`[inventory-email-notifications/id] Found notification: ${id}`);

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('[inventory-email-notifications/id] Error fetching notification:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inventory email notification',
      details: error.message
    });
  }
}

async function handlePut(req, res, id, user) {
  try {
    console.log(`[inventory-email-notifications/id] Updating notification: ${id}`);
    
    const { shopId, alertType, emails, isEnabled } = req.body;

    // Check if notification exists
    const existingNotification = await prisma.inventoryEmailNotification.findUnique({
      where: { id },
      include: {
        shop: {
          select: { id: true, name: true }
        }
      }
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Inventory email notification not found' });
    }

    // Prepare update data
    const updateData = {};

    if (shopId !== undefined) {
      // Validate shop exists (if shopId provided)
      if (shopId) {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true }
        });

        if (!shop) {
          return res.status(404).json({ error: 'Shop not found' });
        }
      }

      updateData.shopId = shopId || null;
    }

    if (alertType !== undefined) {
      // Validate alert type
      const validAlertTypes = ['WARNING', 'CRITICAL', 'ALL'];
      if (!validAlertTypes.includes(alertType)) {
        return res.status(400).json({ 
          error: 'Invalid alert type',
          validAlertTypes
        });
      }

      updateData.alertType = alertType;
    }

    if (emails !== undefined) {
      if (!Array.isArray(emails)) {
        return res.status(400).json({ error: 'Emails must be an array' });
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

      updateData.emails = validEmails;
    }

    if (isEnabled !== undefined) {
      updateData.isEnabled = Boolean(isEnabled);
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // If shopId or alertType is changing, check for conflicts
    if (updateData.shopId !== undefined || updateData.alertType !== undefined) {
      const checkShopId = updateData.shopId !== undefined ? updateData.shopId : existingNotification.shopId;
      const checkAlertType = updateData.alertType || existingNotification.alertType;

      const conflictingNotification = await prisma.inventoryEmailNotification.findUnique({
        where: {
          shopId_alertType: {
            shopId: checkShopId,
            alertType: checkAlertType
          }
        }
      });

      if (conflictingNotification && conflictingNotification.id !== id) {
        return res.status(409).json({ 
          error: 'Another inventory email notification already exists for this shop and alert type combination' 
        });
      }
    }

    // Update the notification
    const notification = await prisma.inventoryEmailNotification.update({
      where: { id },
      data: updateData,
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

    console.log(`[inventory-email-notifications/id] Updated notification: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Inventory email notification updated successfully',
      notification
    });
  } catch (error) {
    console.error('[inventory-email-notifications/id] Error updating notification:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Another inventory email notification already exists for this shop and alert type combination' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to update inventory email notification',
      details: error.message
    });
  }
}

async function handleDelete(req, res, id) {
  try {
    console.log(`[inventory-email-notifications/id] Deleting notification: ${id}`);
    
    // Check if notification exists
    const existingNotification = await prisma.inventoryEmailNotification.findUnique({
      where: { id }
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Inventory email notification not found' });
    }

    // Delete the notification
    await prisma.inventoryEmailNotification.delete({
      where: { id }
    });

    console.log(`[inventory-email-notifications/id] Deleted notification: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Inventory email notification deleted successfully'
    });
  } catch (error) {
    console.error('[inventory-email-notifications/id] Error deleting notification:', error);
    return res.status(500).json({ 
      error: 'Failed to delete inventory email notification',
      details: error.message
    });
  }
}
