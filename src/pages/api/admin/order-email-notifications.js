import { PrismaClient } from '@prisma/client';
import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(`[order-email-notifications] Handling ${req.method} request`);

  try {
    // Get user session with multiple auth methods
    let user;
    try {
      // First try with API authentication method (for direct API calls)
      user = await verifyRequestAndGetUser(req);
      
      if (user) {
        console.log(`[order-email-notifications] API auth successful for user: ${user.id}, role: ${user.role}`);
      } else {
        // If that doesn't work, try with session (for browser usage)
        const session = await getServerSession({ req, res });
        if (session && session.user) {
          user = session.user;
          console.log(`[order-email-notifications] Session auth successful for user: ${user.id}, role: ${user.role}`);
        }
      }
      
      if (!user) {
        console.log('[order-email-notifications] Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
    } catch (authError) {
      console.error('[order-email-notifications] Authentication error:', authError);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user is admin or owner
    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      console.log(`[order-email-notifications] Access denied for role: ${userRole}`);
      return res.status(403).json({ error: 'Access denied. Admin or Owner role required.' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      default:
        console.log(`[order-email-notifications] Method ${req.method} not allowed`);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[order-email-notifications] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, user) {
  try {
    console.log('[order-email-notifications] Fetching email notifications');

    const notifications = await prisma.orderEmailNotification.findMany({
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
        { orderStatus: 'asc' }
      ]
    });

    console.log(`[order-email-notifications] Found ${notifications.length} email notifications`);

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('[order-email-notifications] Error fetching notifications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch email notifications',
      details: error.message
    });
  }
}

async function handlePost(req, res, user) {
  try {
    console.log('[order-email-notifications] Creating new email notification');
    
    const { shopId, orderStatus, emails, isEnabled = true } = req.body;

    // Validate required fields
    if (!shopId || !orderStatus || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ 
        error: 'Missing required fields: shopId, orderStatus, and emails array are required' 
      });
    }

    // Validate order status
    const validStatuses = ['PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ 
        error: 'Invalid order status',
        validStatuses
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

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true }
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if notification for this shop and status already exists
    const existingNotification = await prisma.orderEmailNotification.findUnique({
      where: {
        shopId_orderStatus: {
          shopId,
          orderStatus
        }
      }
    });

    if (existingNotification) {
      return res.status(409).json({ 
        error: `Email notification for ${shop.name} and status ${orderStatus} already exists. Use PUT to update it.` 
      });
    }

    // Create the notification
    const notification = await prisma.orderEmailNotification.create({
      data: {
        shopId,
        orderStatus,
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

    console.log(`[order-email-notifications] Created notification for shop ${shop.name} and status ${orderStatus}`);

    return res.status(201).json({
      success: true,
      message: 'Email notification created successfully',
      notification
    });
  } catch (error) {
    console.error('[order-email-notifications] Error creating notification:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email notification for this shop and order status already exists' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create email notification',
      details: error.message
    });
  }
}
