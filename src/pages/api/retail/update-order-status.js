import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { verifyRequestAndGetUser } from '@/lib/auth';

export default async function handler(req, res) {
  console.log(`[update-order-status] Handling ${req.method} request`);

  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  if (req.method !== 'PUT') {
    console.log(`[update-order-status] Method ${req.method} not allowed`);
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with error handling
    let user;
    try {
      // First try with API authentication method (for direct API calls)
      console.log(`[update-order-status] Checking for API auth token`);
      user = await verifyRequestAndGetUser(req);
      
      if (user) {
        console.log(`[update-order-status] API auth successful for user: ${user.id}, role: ${user.role}`);
      } else {
        console.log(`[update-order-status] API auth failed, trying session auth`);
        // If that doesn't work, try with session (for browser usage)
        const session = await getServerSession({ req, res });
        console.log(`[update-order-status] Session result:`, session ? 'Session found' : 'No session');
        
        if (session && session.user) {
          user = session.user;
          console.log(`[update-order-status] Session auth successful for user: ${user.id}, role: ${user.role}`);
        }
      }
      
      if (!user) {
        console.error('[update-order-status] Authentication failed completely');
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Unauthorized - User authentication failed' });
      }
      
    } catch (authError) {
      console.error('[update-order-status] Authentication error:', authError);
      await prisma.$disconnect();
      return res.status(401).json({ 
        error: 'Authentication failed', 
        details: authError.message
      });
    }

    // Parse and validate request body
    let orderId, status;
    try {
      console.log(`[update-order-status] Request body:`, req.body);
      ({ orderId, status } = req.body);
      console.log(`[update-order-status] Parsed request - Order ID: ${orderId}, Status: ${status}`);
    } catch (parseError) {
      console.error('[update-order-status] Failed to parse request body:', parseError);
      await prisma.$disconnect();
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: 'Could not parse orderId and status from request'
      });
    }

    // Validate request data
    if (!orderId) {
      console.log('[update-order-status] Missing order ID');
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!status) {
      console.log('[update-order-status] Missing status');
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status value
    const validStatusValues = ['PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (!validStatusValues.includes(status)) {
      console.log(`[update-order-status] Invalid status: ${status}`);
      await prisma.$disconnect();
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: validStatusValues,
        receivedValue: status
      });
    }

    // Check if order exists with minimal fields selection to avoid schema issues
    let existingOrder;
    try {
      console.log(`[update-order-status] Fetching order from database: ${orderId}`);
      existingOrder = await prisma.retailOrder.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          shopId: true,
          status: true,
          items: {
            select: {
              id: true,
              coffeeId: true,
              smallBags: true,
              largeBags: true,
              totalQuantity: true
            }
          }
        }
      });

      if (!existingOrder) {
        console.log(`[update-order-status] Order not found: ${orderId}`);
        await prisma.$disconnect();
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[update-order-status] Found order ${orderId}, current status: ${existingOrder.status}`);
    } catch (dbError) {
      console.error(`[update-order-status] Database error when fetching order:`, dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Failed to fetch order from database',
        details: dbError.message
      });
    }

    // Role-based permission checks for status updates
    const userRole = user.role;
    console.log(`[update-order-status] User role for status update: ${userRole}`);
    
    // Admin and Owner can perform any status change - skip permission checks
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      console.log(`[update-order-status] Checking permissions for role: ${userRole}`);
      if (userRole === 'ROASTER') {
        // Roasters can update PENDING to CONFIRMED to ROASTED to DISPATCHED
        const allowedTransitions = {
          'PENDING': ['CONFIRMED'],
          'CONFIRMED': ['ROASTED'],
          'ROASTED': ['DISPATCHED'],
          'DISPATCHED': [], // Roasters cannot change from DISPATCHED status
          'DELIVERED': [],
          'CANCELLED': []
        };
        
        // Check if the current order status can be updated to the requested status
        const currentStatus = existingOrder.status;
        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
          console.log(`[update-order-status] Permission denied: Roaster cannot change from ${currentStatus} to ${status}`);
          await prisma.$disconnect();
          return res.status(403).json({ 
            error: `Roasters cannot change order status from '${currentStatus}' to '${status}'`,
            allowedNextStatuses: allowedTransitions[currentStatus] || []
          });
        }
      } else if (userRole === 'RETAILER') {
        // Retailers can change DISPATCHED to DELIVERED or CANCELLED, and can CANCEL from any status
        const allowedTransitions = {
          'PENDING': ['CANCELLED'],
          'CONFIRMED': ['CANCELLED'],
          'ROASTED': ['CANCELLED'],
          'DISPATCHED': ['DELIVERED', 'CANCELLED'],
          'DELIVERED': [],
          'CANCELLED': []
        };
        
        const currentStatus = existingOrder.status;
        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
          console.log(`[update-order-status] Permission denied: Retailer cannot change from ${currentStatus} to ${status}`);
          await prisma.$disconnect();
          return res.status(403).json({ 
            error: `Retailers cannot change order status from '${currentStatus}' to '${status}'`,
            allowedNextStatuses: allowedTransitions[currentStatus] || []
          });
        }
      } else if (userRole === 'BARISTA') {
        // Baristas can change DISPATCHED to DELIVERED only
        const allowedTransitions = {
          'PENDING': [],
          'CONFIRMED': [],
          'ROASTED': [],
          'DISPATCHED': ['DELIVERED'],
          'DELIVERED': [],
          'CANCELLED': []
        };
        
        const currentStatus = existingOrder.status;
        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
          console.log(`[update-order-status] Permission denied: Barista cannot change from ${currentStatus} to ${status}`);
          await prisma.$disconnect();
          return res.status(403).json({ 
            error: `Baristas cannot change order status from '${currentStatus}' to '${status}'`,
            allowedNextStatuses: allowedTransitions[currentStatus] || []
          });
        }
      } else {
        // Unknown role - deny permission
        console.log(`[update-order-status] Permission denied: Unknown role ${userRole}`);
        await prisma.$disconnect();
        return res.status(403).json({ 
          error: `User with role '${userRole}' does not have permission to update order status`
        });
      }
    } else {
      console.log(`[update-order-status] User has ${userRole} role - all status changes are allowed`);
    }

    // All validations passed, update the order status
    let updatedOrder;
    try {
      // Use a transaction to ensure all database operations are atomic
      console.log(`[update-order-status] Starting database transaction to update order ${orderId} to ${status}`);
      updatedOrder = await prisma.$transaction(async (tx) => {
        console.log(`[update-order-status] Updating order status to ${status}`);
        
        // Update order status with minimal fields selection - no Shop details to avoid schema issues
        const updated = await tx.retailOrder.update({
          where: { id: orderId },
          data: {
            status: status,
            updatedAt: new Date()
          },
          select: {
            id: true,
            shopId: true,
            status: true,
            updatedAt: true
            // Remove any Shop selection to avoid schema differences
          }
        });
        
        console.log(`[update-order-status] Updated order ${orderId} status from ${existingOrder.status} to ${status}`);

        // If the status is being changed to DELIVERED, update the inventory
        if (status === 'DELIVERED') {
          console.log(`[update-order-status] Order ${orderId} marked as DELIVERED - updating inventory quantities`);
          
          // Process each item in the order
          for (const item of existingOrder.items) {
            console.log(`[update-order-status] Processing inventory update for item: Coffee ${item.coffeeId} - ${item.smallBags} small bags, ${item.largeBags} large bags`);
            
            try {
              // Update shop inventory with minimal field selection to avoid schema differences
              await tx.retailInventory.upsert({
                where: {
                  shopId_coffeeId: {
                    shopId: existingOrder.shopId,
                    coffeeId: item.coffeeId
                  }
                },
                create: {
                  shopId: existingOrder.shopId,
                  coffeeId: item.coffeeId,
                  smallBags: item.smallBags || 0,
                  largeBags: item.largeBags || 0,
                  totalQuantity: item.totalQuantity || 0,
                  lastOrderDate: new Date()
                },
                update: {
                  smallBags: {
                    increment: item.smallBags || 0
                  },
                  largeBags: {
                    increment: item.largeBags || 0
                  },
                  totalQuantity: {
                    increment: item.totalQuantity || 0
                  },
                  lastOrderDate: new Date()
                }
              });
              
              console.log(`[update-order-status] Inventory updated for coffee ${item.coffeeId} in shop ${existingOrder.shopId}`);
            } catch (inventoryError) {
              console.error(`[update-order-status] Error updating inventory for coffee ${item.coffeeId}:`, inventoryError);
              // Continue with other items despite error
            }
          }
        }
        
        return updated;
      });
      
    } catch (dbError) {
      console.error('[update-order-status] Database error during update:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Failed to update order status in the database',
        details: dbError.message
      });
    }

    // Success! Return the updated order with minimal data
    console.log(`[update-order-status] Successfully updated order ${orderId} to status ${status}`);
    await prisma.$disconnect();
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: updatedOrder.id,
        shopId: updatedOrder.shopId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });
    
  } catch (error) {
    // Catch any unhandled errors
    console.error('[update-order-status] Unhandled error:', error);
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('[update-order-status] Error disconnecting from database:', disconnectError);
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing the order status update',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 