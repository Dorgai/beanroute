import { PrismaClient } from '@prisma/client';
import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(`[order-email-notifications/id] Handling ${req.method} request for ID: ${req.query.id}`);

  try {
    // Get user session with multiple auth methods
    let user;
    try {
      // First try with API authentication method (for direct API calls)
      user = await verifyRequestAndGetUser(req);
      
      if (user) {
        console.log(`[order-email-notifications/id] API auth successful for user: ${user.id}, role: ${user.role}`);
      } else {
        // If that doesn't work, try with session (for browser usage)
        const session = await getServerSession({ req, res });
        if (session && session.user) {
          user = session.user;
          console.log(`[order-email-notifications/id] Session auth successful for user: ${user.id}, role: ${user.role}`);
        }
      }
      
      if (!user) {
        console.log('[order-email-notifications/id] Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
    } catch (authError) {
      console.error('[order-email-notifications/id] Authentication error:', authError);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user is admin or owner
    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      console.log(`[order-email-notifications/id] Access denied for role: ${userRole}`);
      return res.status(403).json({ error: 'Access denied. Admin or Owner role required.' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id, user);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        console.log(`[order-email-notifications/id] Method ${req.method} not allowed`);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[order-email-notifications/id] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, id) {
  try {
    console.log(`[order-email-notifications/id] Fetching notification: ${id}`);

    const notification = await prisma.orderEmailNotification.findUnique({
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
      return res.status(404).json({ error: 'Email notification not found' });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('[order-email-notifications/id] Error fetching notification:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch email notification',
      details: error.message
    });
  }
}

async function handlePut(req, res, id, user) {
  try {
    console.log(`[order-email-notifications/id] Updating notification: ${id}`);
    
    const { shopId, orderStatus, emails, isEnabled } = req.body;

    // Check if notification exists
    const existingNotification = await prisma.orderEmailNotification.findUnique({
      where: { id },
      include: {
        shop: {
          select: { id: true, name: true }
        }
      }
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Email notification not found' });
    }

    // Prepare update data
    const updateData = {};

    if (shopId !== undefined) {
      // Validate shop exists
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true }
      });

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }

      updateData.shopId = shopId;
    }

    if (orderStatus !== undefined) {
      // Validate order status
      const validStatuses = ['PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ 
          error: 'Invalid order status',
          validStatuses
        });
      }

      updateData.orderStatus = orderStatus;
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

    // If shopId or orderStatus is changing, check for conflicts
    if (updateData.shopId || updateData.orderStatus) {
      const checkShopId = updateData.shopId || existingNotification.shopId;
      const checkOrderStatus = updateData.orderStatus || existingNotification.orderStatus;

      const conflictingNotification = await prisma.orderEmailNotification.findUnique({
        where: {
          shopId_orderStatus: {
            shopId: checkShopId,
            orderStatus: checkOrderStatus
          }
        }
      });

      if (conflictingNotification && conflictingNotification.id !== id) {
        return res.status(409).json({ 
          error: 'Another email notification already exists for this shop and order status combination' 
        });
      }
    }

    // Update the notification
    const notification = await prisma.orderEmailNotification.update({
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

    console.log(`[order-email-notifications/id] Updated notification: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Email notification updated successfully',
      notification
    });
  } catch (error) {
    console.error('[order-email-notifications/id] Error updating notification:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email notification for this shop and order status already exists' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to update email notification',
      details: error.message
    });
  }
}

async function handleDelete(req, res, id) {
  try {
    console.log(`[order-email-notifications/id] Deleting notification: ${id}`);

    // Check if notification exists
    const existingNotification = await prisma.orderEmailNotification.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Email notification not found' });
    }

    // Delete the notification
    await prisma.orderEmailNotification.delete({
      where: { id }
    });

    console.log(`[order-email-notifications/id] Deleted notification: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Email notification deleted successfully'
    });
  } catch (error) {
    console.error('[order-email-notifications/id] Error deleting notification:', error);
    return res.status(500).json({ 
      error: 'Failed to delete email notification',
      details: error.message
    });
  }
}
