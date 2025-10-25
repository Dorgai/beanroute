import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { verifyRequestAndGetUser } from '@/lib/auth';
import orderEmailService from '@/lib/order-email-service';
import pushNotificationService from '@/lib/push-notification-service';
import { getHaircutPercentage } from '@/lib/haircut-service';

/**
 * Handle green coffee stock adjustments when orders are cancelled
 * When an order is cancelled, we need to restore the green coffee stock
 * that was consumed when the order was created (including the haircut)
 */
async function handleGreenCoffeeStockAdjustments(tx, order, newStatus) {
  const oldStatus = order.status;
  
  // Only adjust stock when cancelling an order
  if (newStatus !== 'CANCELLED') {
    console.log(`[green-coffee-stock] No stock adjustment needed for status change: ${oldStatus} -> ${newStatus}`);
    return;
  }
  
  console.log(`[green-coffee-stock] Order ${order.id} being cancelled - restoring green coffee stock`);
  
  try {
    // Get current haircut percentage
    const haircutPercentage = await getHaircutPercentage(tx);
    const haircutMultiplier = 1 + (haircutPercentage / 100);
    
    console.log(`[green-coffee-stock] Using haircut percentage: ${haircutPercentage}% (multiplier: ${haircutMultiplier})`);
    
    // Process each item in the cancelled order
    const stockAdjustmentPromises = order.items.map(async (item) => {
      try {
        // Calculate the total green coffee consumption that was originally deducted
        const totalGreenConsumption = (item.totalQuantity || 0) * haircutMultiplier;
        const haircutAmount = (item.totalQuantity || 0) * (haircutPercentage / 100);
        
        console.log(`[green-coffee-stock] Restoring coffee ${item.coffeeId}:`);
        console.log(`  - Retail quantity: ${item.totalQuantity || 0}kg`);
        console.log(`  - Haircut amount: ${haircutAmount.toFixed(2)}kg`);
        console.log(`  - Total green consumption to restore: ${totalGreenConsumption.toFixed(2)}kg`);
        
        // Restore the green coffee stock (increment by the amount that was originally decremented)
        await tx.greenCoffee.update({
          where: { id: item.coffeeId },
          data: {
            quantity: {
              increment: totalGreenConsumption
            }
          }
        });
        
        console.log(`[green-coffee-stock] Successfully restored ${totalGreenConsumption.toFixed(2)}kg of green coffee for ${item.coffeeId}`);
        
        return { 
          success: true, 
          coffeeId: item.coffeeId, 
          restoredAmount: totalGreenConsumption,
          haircutAmount: haircutAmount
        };
      } catch (error) {
        console.error(`[green-coffee-stock] Error restoring green coffee stock for ${item.coffeeId}:`, error);
        return { 
          success: false, 
          coffeeId: item.coffeeId, 
          error: error.message 
        };
      }
    });
    
    // Execute all stock adjustments in parallel
    const results = await Promise.allSettled(stockAdjustmentPromises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`[green-coffee-stock] Stock restoration completed: ${successful} successful, ${failed} failed`);
    
    // Log detailed results for debugging
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`[green-coffee-stock] Item ${index + 1}: SUCCESS - Restored ${result.value.restoredAmount.toFixed(2)}kg for coffee ${result.value.coffeeId}`);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.error(`[green-coffee-stock] Item ${index + 1}: FAILED - ${error}`);
      }
    });
    
  } catch (error) {
    console.error(`[green-coffee-stock] Error in green coffee stock adjustment:`, error);
    // Don't throw - we don't want to fail the entire transaction if stock adjustment fails
  }
}

/**
 * Handle label quantity updates based on order status changes
 * Rules:
 * - PENDING: Decrease label quantities (reserve labels for the order)
 * - CANCELLED: Increase label quantities back (return reserved labels)
 * - 1 label per bag regardless of size or type
 */
async function handleLabelQuantityUpdates(tx, order, newStatus) {
  const oldStatus = order.status;
  
  console.log(`[label-tracking] Handling label updates for order ${order.id}: ${oldStatus} -> ${newStatus}`);
  
  // Calculate total bags per coffee type in the order
  const coffeeLabelsNeeded = {};
  
  for (const item of order.items) {
    // Calculate total bags for this coffee type (1 label per bag)
    const totalBags = (item.smallBags || 0) + (item.smallBagsEspresso || 0) + 
                     (item.smallBagsFilter || 0) + (item.largeBags || 0);
    
    if (totalBags > 0) {
      coffeeLabelsNeeded[item.coffeeId] = (coffeeLabelsNeeded[item.coffeeId] || 0) + totalBags;
    }
  }
  
  // Determine label quantity change direction
  let labelChange = 0;
  
  if (oldStatus !== 'PENDING' && newStatus === 'PENDING') {
    // Order becoming PENDING - reserve labels (decrease)
    labelChange = -1;
    console.log(`[label-tracking] Order becoming PENDING - reserving labels`);
  } else if (oldStatus === 'PENDING' && newStatus === 'CANCELLED') {
    // Order cancelled from PENDING - return labels (increase)
    labelChange = 1;
    console.log(`[label-tracking] Order cancelled from PENDING - returning labels`);
  } else if (oldStatus !== 'CANCELLED' && newStatus === 'CANCELLED') {
    // Order cancelled from non-PENDING status - only return if it was previously pending
    // We need to check if this order was ever PENDING to avoid double-returning labels
    // For simplicity, we'll assume any CANCELLED order should return labels
    labelChange = 1;
    console.log(`[label-tracking] Order cancelled - returning labels`);
  }
  
  if (labelChange !== 0) {
    // Batch update label quantities for better performance
    const updatePromises = Object.entries(coffeeLabelsNeeded).map(async ([coffeeId, labelsNeeded]) => {
      const actualChange = labelChange * labelsNeeded;
      
      try {
        await tx.greenCoffee.update({
          where: { id: coffeeId },
          data: {
            labelQuantity: {
              increment: actualChange
            }
          }
        });
        
        console.log(`[label-tracking] Updated coffee ${coffeeId} label quantity by ${actualChange} (${labelsNeeded} labels needed)`);
        return { success: true, coffeeId, actualChange };
      } catch (error) {
        console.error(`[label-tracking] Error updating label quantity for coffee ${coffeeId}:`, error);
        return { success: false, coffeeId, error: error.message };
      }
    });

    // Execute all updates in parallel within the transaction
    const results = await Promise.allSettled(updatePromises);
    console.log(`[label-tracking] Batch label update completed:`, results.filter(r => r.status === 'fulfilled').length, 'successful,', results.filter(r => r.status === 'rejected').length, 'failed');
  } else {
    console.log(`[label-tracking] No label quantity changes needed for status transition ${oldStatus} -> ${newStatus}`);
  }
}

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
      const orderFetchStart = Date.now();
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
              smallBags: true,        // Keep for backward compatibility
              smallBagsEspresso: true, // Add separate espresso field
              smallBagsFilter: true,   // Add separate filter field
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

      const orderFetchTime = Date.now() - orderFetchStart;
      console.log(`[update-order-status] Found order ${orderId}, current status: ${existingOrder.status} (fetch took ${orderFetchTime}ms)`);
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
      const transactionStart = Date.now();
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

        // Handle green coffee stock adjustments when cancelling orders
        const stockUpdateStart = Date.now();
        await handleGreenCoffeeStockAdjustments(tx, existingOrder, status);
        const stockUpdateTime = Date.now() - stockUpdateStart;
        console.log(`[update-order-status] Green coffee stock adjustments completed in ${stockUpdateTime}ms`);

        // Handle label quantity updates based on status changes
        const labelUpdateStart = Date.now();
        await handleLabelQuantityUpdates(tx, existingOrder, status);
        const labelUpdateTime = Date.now() - labelUpdateStart;
        console.log(`[update-order-status] Label quantity updates completed in ${labelUpdateTime}ms`);

        // If the status is being changed to DELIVERED, update the inventory
        if (status === 'DELIVERED') {
          const deliveredUpdateStart = Date.now();
          console.log(`[update-order-status] Order ${orderId} marked as DELIVERED - updating inventory quantities for ${existingOrder.items.length} items`);
          
          // Log the order items for debugging
          existingOrder.items.forEach((item, index) => {
            console.log(`[update-order-status] Order item ${index + 1}: Coffee ${item.coffeeId}, Small Espresso: ${item.smallBagsEspresso || 0}, Small Filter: ${item.smallBagsFilter || 0}, Large: ${item.largeBags || 0}, Total: ${item.totalQuantity || 0}kg`);
          });
          
          // Batch process all items in parallel for better performance
          const inventoryUpdatePromises = existingOrder.items.map(async (item) => {
            // Handle backward compatibility - if separate fields don't exist, split the combined field
            const smallBagsEspresso = item.smallBagsEspresso !== undefined ? item.smallBagsEspresso : 
              (item.smallBags ? Math.ceil(item.smallBags / 2) : 0);
            const smallBagsFilter = item.smallBagsFilter !== undefined ? item.smallBagsFilter : 
              (item.smallBags ? Math.floor(item.smallBags / 2) : 0);
            
            console.log(`[update-order-status] Processing inventory update for item: Coffee ${item.coffeeId} - smallE ${smallBagsEspresso}, smallF ${smallBagsFilter}, large ${item.largeBags || 0}`);
            
            try {
              // First, check if the inventory record exists
              const existingInventory = await tx.retailInventory.findUnique({
                where: {
                  shopId_coffeeId: {
                    shopId: existingOrder.shopId,
                    coffeeId: item.coffeeId
                  }
                },
                select: {
                  id: true,
                  smallBagsEspresso: true,
                  smallBagsFilter: true,
                  largeBags: true,
                  totalQuantity: true
                }
              });
              
              console.log(`[update-order-status] Existing inventory for coffee ${item.coffeeId}:`, existingInventory);
              
              // Update shop inventory with separate espresso/filter fields
              const updatedInventory = await tx.retailInventory.upsert({
                where: {
                  shopId_coffeeId: {
                    shopId: existingOrder.shopId,
                    coffeeId: item.coffeeId
                  }
                },
                create: {
                  shopId: existingOrder.shopId,
                  coffeeId: item.coffeeId,
                  smallBagsEspresso: smallBagsEspresso,
                  smallBagsFilter: smallBagsFilter,
                  largeBags: item.largeBags || 0,
                  totalQuantity: item.totalQuantity || 0,
                  lastOrderDate: new Date()
                },
                update: {
                  smallBagsEspresso: {
                    increment: smallBagsEspresso
                  },
                  smallBagsFilter: {
                    increment: smallBagsFilter
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
              
              console.log(`[update-order-status] Successfully updated inventory for coffee ${item.coffeeId} in shop ${existingOrder.shopId}:`, {
                previous: existingInventory,
                added: {
                  smallBagsEspresso: smallBagsEspresso,
                  smallBagsFilter: smallBagsFilter,
                  largeBags: item.largeBags || 0,
                  totalQuantity: item.totalQuantity || 0
                },
                result: updatedInventory
              });
              
              return { success: true, coffeeId: item.coffeeId, updatedInventory };
            } catch (inventoryError) {
              console.error(`[update-order-status] Error updating inventory for coffee ${item.coffeeId}:`, inventoryError);
              console.error(`[update-order-status] Error details:`, {
                error: inventoryError.message,
                code: inventoryError.code,
                meta: inventoryError.meta
              });
              return { success: false, coffeeId: item.coffeeId, error: inventoryError.message };
            }
          });
          
          // Execute all inventory updates in parallel within the transaction
          const inventoryResults = await Promise.allSettled(inventoryUpdatePromises);
          const deliveredUpdateTime = Date.now() - deliveredUpdateStart;
          
          // Log detailed results
          console.log(`[update-order-status] DELIVERED inventory updates completed in ${deliveredUpdateTime}ms`);
          console.log(`[update-order-status] Results:`, inventoryResults.map((result, index) => {
            if (result.status === 'fulfilled') {
              return `Item ${index + 1}: ${result.value.success ? 'SUCCESS' : 'FAILED'} - ${result.value.coffeeId}`;
            } else {
              return `Item ${index + 1}: REJECTED - ${result.reason}`;
            }
          }));
          
          // Check for failures
          const failedUpdates = inventoryResults
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
            .map(r => r.status === 'rejected' ? { error: r.reason } : r.value);
          
          if (failedUpdates.length > 0) {
            console.error(`[update-order-status] ${failedUpdates.length} inventory updates failed:`, failedUpdates);
            // Don't fail the transaction, but log the errors
          } else {
            console.log(`[update-order-status] All inventory updates completed successfully`);
          }
        }
        
        return updated;
      });
      
      const transactionTime = Date.now() - transactionStart;
      console.log(`[update-order-status] Transaction completed in ${transactionTime}ms`);
      
    } catch (dbError) {
      console.error('[update-order-status] Database error during update:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Failed to update order status in the database',
        details: dbError.message
      });
    }

    // Send email notifications for status change
    console.log(`[update-order-status] Sending email notifications for status change from ${existingOrder.status} to ${status}`);
    try {
      const emailResult = await orderEmailService.sendOrderStatusChangeNotification(
        orderId, 
        existingOrder.status, 
        status, 
        user.id
      );
      
      if (emailResult.success) {
        console.log(`[update-order-status] Email notifications sent successfully: ${emailResult.message}`);
      } else {
        console.log(`[update-order-status] Email notifications not sent: ${emailResult.error || emailResult.message}`);
      }
    } catch (emailError) {
      // Don't fail the entire operation if email sending fails
      console.error('[update-order-status] Error sending email notifications:', emailError);
    }

    // Send push notifications for status change
    console.log(`[update-order-status] Sending push notifications for status change from ${existingOrder.status} to ${status}`);
    try {
      const pushResult = await pushNotificationService.sendOrderStatusChangeNotification(
        orderId,
        existingOrder.status,
        status,
        {
          shopId: updatedOrder.shopId,
          shopName: updatedOrder.shop?.name || 'Shop',
          orderNumber: orderId.slice(-8), // Use last 8 chars as order number
          userId: user.id
        }
      );
      
      if (pushResult.success) {
        console.log(`[update-order-status] Push notifications sent successfully: ${pushResult.message}`);
      } else {
        console.log(`[update-order-status] Push notifications not sent: ${pushResult.error || pushResult.message}`);
      }
    } catch (pushError) {
      // Don't fail the entire operation if push notification sending fails
      console.error('[update-order-status] Error sending push notifications:', pushError);
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