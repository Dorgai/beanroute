import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';
import { createActivityLog } from '@/lib/activity-service';
import { Prisma } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Update order status - session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session validation failed' });
    }

    const { orderId, status } = req.body;
    console.log(`Update order status request: Order ID ${orderId}, Status ${status}`);

    // Validate request data
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatusValues = ['PENDING', 'CONFIRMED', 'ROASTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (!validStatusValues.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: validStatusValues,
        receivedValue: status
      });
    }

    // Check if order exists
    const existingOrder = await prisma.retailOrder.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
        items: {
          include: {
            coffee: true
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Found order ${orderId}, current status: ${existingOrder.status}`);

    // Role-based permission checks for status updates
    const userRole = session.user.role;
    
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
        return res.status(403).json({ 
          error: `Baristas cannot change order status from '${currentStatus}' to '${status}'`,
          allowedNextStatuses: allowedTransitions[currentStatus] || []
        });
      }
    }
    // Admin and Owner can change to any status - no restrictions needed

    try {
      // Use a transaction to ensure all database operations are atomic
      const updatedOrder = await prisma.$transaction(async (tx) => {
        console.log(`Updating order status to ${status}`);
        
        // Use executeRaw with proper quoting for the enum value
        await tx.$executeRaw`
          UPDATE "RetailOrder"
          SET status = ${status}::text::\"OrderStatus\", "updatedAt" = now()
          WHERE id = ${orderId}
        `;
        
        // Fetch the updated order
        const result = await tx.retailOrder.findUnique({
          where: { id: orderId },
          include: {
            shop: true,
            items: {
              include: {
                coffee: true
              }
            }
          }
        });
        
        console.log(`Updated order ${orderId} status from ${existingOrder.status} to ${status}`);

        // If the status is being changed to DELIVERED, update the inventory
        if (status === 'DELIVERED') {
          console.log(`Order ${orderId} marked as DELIVERED - updating inventory quantities`);
          
          // Process each item in the order
          for (const item of existingOrder.items) {
            console.log(`Processing inventory update for item: Coffee ${item.coffeeId} - ${item.smallBags} small bags, ${item.largeBags} large bags`);
            
            // Update shop inventory
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
                smallBags: item.smallBags,
                largeBags: item.largeBags,
                totalQuantity: item.totalQuantity,
                lastOrderDate: new Date()
              },
              update: {
                smallBags: {
                  increment: item.smallBags
                },
                largeBags: {
                  increment: item.largeBags
                },
                totalQuantity: {
                  increment: item.totalQuantity
                },
                lastOrderDate: new Date()
              }
            });
            
            console.log(`Updated inventory for coffee ${item.coffeeId} in shop ${existingOrder.shopId}`);
          }
        }
        // If the status is being changed to CANCELLED, return the coffee quantity to inventory
        else if (status === 'CANCELLED' && existingOrder.status !== 'DELIVERED') {
          console.log(`Order ${orderId} marked as CANCELLED - returning reserved quantities to inventory`);
          
          // Process each item in the order
          for (const item of existingOrder.items) {
            console.log(`Returning ${item.totalQuantity}kg of coffee ${item.coffeeId} to inventory`);
            
            // Return the reserved quantity back to green coffee inventory
            await tx.greenCoffee.update({
              where: { id: item.coffeeId },
              data: {
                quantity: {
                  increment: item.totalQuantity
                }
              }
            });
            
            console.log(`Returned coffee ${item.coffeeId} quantity by ${item.totalQuantity}kg`);
          }
        }
        
        return result;
      });

      // Create activity log
      try {
        await createActivityLog(session.user.id, 'UPDATE', 'RETAIL_ORDER', orderId, {
          previousStatus: existingOrder.status,
          newStatus: status
        });
        console.log('Created activity log for order status update', orderId);
      } catch (logError) {
        // Don't fail the request if activity log fails
        console.error('Failed to create activity log:', logError);
      }

      return res.status(200).json(updatedOrder);
    } catch (dbError) {
      console.error('Database error updating order status:', dbError);
      return res.status(500).json({ 
        error: 'Failed to update order status',
        details: process.env.NODE_ENV === 'development' ? dbError.message : 'Database update failed'
      });
    }
  } catch (error) {
    console.error('Unhandled error updating order status:', error);
    return res.status(500).json({ 
      error: 'Failed to update order status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 