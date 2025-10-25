// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { createActivityLog } from '@/lib/activity-service';
import orderEmailService from '@/lib/order-email-service';
import pushNotificationService from '@/lib/push-notification-service';
import { getHaircutPercentage } from '@/lib/haircut-service';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  if (req.method !== 'POST') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection and SystemSettings table
    try {
      await prisma.$connect();
      console.log('Database connection successful');
      
      // Test if SystemSettings table exists by trying to count records
      const settingsCount = await prisma.systemSettings.count();
      console.log(`SystemSettings table accessible, found ${settingsCount} records`);
    } catch (dbTestError) {
      console.error('Database connection or SystemSettings table test failed:', dbTestError);
      // Continue anyway - we'll handle haircut failures gracefully
    }

    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Create order - session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Check if user has permission to create retail orders
    if (session.user.role === 'ROASTER') {
      console.log('Roaster attempted to create retail order');
      await prisma.$disconnect();
      return res.status(403).json({ error: 'Roasters cannot create retail orders' });
    }

    const { shopId, items, comment } = req.body;
    console.log('Create order request for shop:', shopId, 'items count:', items?.length);

    // Validate request data
    if (!shopId) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate comment length if provided
    if (comment && comment.length > 200) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Comment must be 200 characters or less' });
    }

    // Validate each item has a valid coffeeId and at least one bag
    const processedItems = items.map(item => {
      const smallBagsEspresso = parseInt(item.smallBagsEspresso) || 0;
      const smallBagsFilter = parseInt(item.smallBagsFilter) || 0;
      const mediumBagsEspresso = parseInt(item.mediumBagsEspresso) || 0;
      const mediumBagsFilter = parseInt(item.mediumBagsFilter) || 0;
      const largeBags = parseInt(item.largeBags) || 0;
      
      // For backward compatibility, if smallBags is provided but not espresso/filter, use it as espresso
      const legacySmallBags = parseInt(item.smallBags) || 0;
      const finalEspresso = smallBagsEspresso || legacySmallBags;
      const finalFilter = smallBagsFilter;
      
      return {
        coffeeId: item.coffeeId,
        smallBags: finalEspresso + finalFilter, // Keep for backward compatibility
        smallBagsEspresso: finalEspresso,
        smallBagsFilter: finalFilter,
        mediumBagsEspresso: mediumBagsEspresso,
        mediumBagsFilter: mediumBagsFilter,
        largeBags: largeBags,
        totalQuantity: ((finalEspresso + finalFilter) * 0.2) + (mediumBagsEspresso * 0.5) + (mediumBagsFilter * 0.5) + (largeBags * 1.0)
      };
    });
    
    const invalidItems = processedItems.filter(item => 
      !item.coffeeId || 
      (item.smallBagsEspresso <= 0 && item.smallBagsFilter <= 0 && item.mediumBagsEspresso <= 0 && item.mediumBagsFilter <= 0 && item.largeBags <= 0)
    );

    if (invalidItems.length > 0) {
      await prisma.$disconnect();
      return res.status(400).json({ 
        error: 'Invalid items in order', 
        details: invalidItems.map(item => item.coffeeId || 'unknown')
      });
    }

    // Create order without transaction first
    let newOrder;
    try {
      console.log('Creating base order');
      newOrder = await prisma.retailOrder.create({
        data: {
          shopId,
          orderedById: session.user.id,
          status: 'PENDING',
          comment: comment || null
        }
      });
      console.log('Created order:', newOrder.id);
    } catch (orderError) {
      console.error('Error creating order:', orderError);
      await prisma.$disconnect();
      return res.status(500).json({
        error: 'Failed to create order',
        details: 'Error creating base order record'
      });
    }
    
    // Batch create order items and update inventory for better performance
    let orderItems = []; // Declare orderItems in outer scope
    
    try {
      const batchStart = Date.now();
      console.log(`Creating ${processedItems.length} order items in batch`);
      
      // Create all order items in parallel
      const orderItemPromises = processedItems.map(item => {
        console.log(`[create-order] Adding item for order ${newOrder.id}, coffee ${item.coffeeId}:`, {
          smallBagsEspresso: item.smallBagsEspresso,
          smallBagsFilter: item.smallBagsFilter,
          largeBags: item.largeBags,
          totalQuantity: item.totalQuantity,
          smallBags: item.smallBags // For backward compatibility
        });
        
        return prisma.retailOrderItem.create({
          data: {
            orderId: newOrder.id,
            coffeeId: item.coffeeId,
            smallBags: item.smallBags,
            smallBagsEspresso: item.smallBagsEspresso,
            smallBagsFilter: item.smallBagsFilter,
            largeBags: item.largeBags,
            totalQuantity: item.totalQuantity
          }
        });
      });
      
      orderItems = await Promise.all(orderItemPromises);
      console.log(`Created ${orderItems.length} order items successfully`);
      
      // Update coffee quantities in parallel with haircut applied
      const coffeeUpdatePromises = processedItems.map(async (item) => {
        try {
          // Get haircut percentage for this coffee
          let haircutPercentage = 15; // Default fallback
          try {
            haircutPercentage = await getHaircutPercentage(prisma);
            console.log(`[create-order] Coffee ${item.coffeeId}: Using haircut percentage: ${haircutPercentage}%`);
          } catch (haircutError) {
            console.error(`Error getting haircut percentage for coffee ${item.coffeeId}:`, haircutError);
            // Already set to default 15%
          }
          
          // Ensure haircut percentage is a valid number
          if (isNaN(haircutPercentage) || haircutPercentage < 0 || haircutPercentage > 100) {
            console.warn(`Invalid haircut percentage for coffee ${item.coffeeId}: ${haircutPercentage}, using default 15%`);
            haircutPercentage = 15;
          }
          
          const haircutMultiplier = 1 + (haircutPercentage / 100);
          const totalGreenConsumption = item.totalQuantity * haircutMultiplier;
          const haircutAmount = item.totalQuantity * (haircutPercentage / 100);
          
          console.log(`[create-order] Coffee ${item.coffeeId} calculation:`);
          console.log(`  - Retail quantity ordered: ${item.totalQuantity}kg`);
          console.log(`  - Haircut percentage: ${haircutPercentage}%`);
          console.log(`  - Haircut amount: ${haircutAmount.toFixed(2)}kg`);
          console.log(`  - Total green consumption: ${totalGreenConsumption.toFixed(2)}kg`);
          
          await prisma.greenCoffee.update({
            where: { id: item.coffeeId },
            data: {
              quantity: {
                decrement: totalGreenConsumption
              }
            }
          });
          
          console.log(`Updated coffee ${item.coffeeId} quantity by -${totalGreenConsumption.toFixed(2)}kg (retail: ${item.totalQuantity}kg + haircut: ${haircutAmount.toFixed(2)}kg)`);
          return { success: true, coffeeId: item.coffeeId, greenConsumption: totalGreenConsumption };
        } catch (coffeeError) {
          console.error(`Error updating coffee quantity for ${item.coffeeId}:`, coffeeError);
          return { success: false, coffeeId: item.coffeeId, error: coffeeError.message };
        }
      });
      
      const coffeeUpdateResults = await Promise.allSettled(coffeeUpdatePromises);
      console.log(`Coffee quantity updates completed:`, coffeeUpdateResults.filter(r => r.status === 'fulfilled').length, 'successful');
      
      // Check if any coffee updates failed
      const failedCoffeeUpdates = coffeeUpdateResults
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => r.value);
      
      if (failedCoffeeUpdates.length > 0) {
        console.warn(`Some coffee quantity updates failed:`, failedCoffeeUpdates);
        // Continue with order creation - don't fail the entire order
      }
      
      // Update retail inventory records in parallel
      const inventoryUpdatePromises = processedItems.map(async (item) => {
        try {
          await prisma.retailInventory.upsert({
            where: {
              shopId_coffeeId: {
                shopId,
                coffeeId: item.coffeeId
              }
            },
            create: {
              shopId,
              coffeeId: item.coffeeId,
              smallBagsEspresso: 0,
              smallBagsFilter: 0,
              largeBags: 0,
              totalQuantity: 0,
              lastOrderDate: new Date()
            },
            update: {
              lastOrderDate: new Date()
            }
          });
          
          console.log(`Updated retail inventory for coffee ${item.coffeeId} in shop ${shopId}`);
          return { success: true, coffeeId: item.coffeeId };
        } catch (inventoryError) {
          console.error(`Error updating retail inventory for coffee ${item.coffeeId}:`, inventoryError);
          return { success: false, coffeeId: item.coffeeId, error: inventoryError.message };
        }
      });
      
      const inventoryResults = await Promise.allSettled(inventoryUpdatePromises);
      console.log(`Retail inventory updates completed:`, inventoryResults.filter(r => r.status === 'fulfilled').length, 'successful');
      
      // Check if any inventory updates failed
      const failedInventoryUpdates = inventoryResults
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => r.value);
      
      if (failedInventoryUpdates.length > 0) {
        console.warn(`Some inventory updates failed:`, failedInventoryUpdates);
        // Continue with order creation - don't fail the entire order
      }
      
      const batchTime = Date.now() - batchStart;
      console.log(`[create-order] Batch operations completed in ${batchTime}ms`);
      
    } catch (batchError) {
      console.error('Error in batch operations:', batchError);
      
      // Clean up: Delete the base order if batch operations fail
      try {
        await prisma.retailOrder.delete({
          where: { id: newOrder.id }
        });
        console.log('Deleted incomplete order due to batch operation failure');
      } catch (cleanupError) {
        console.error('Error cleaning up incomplete order:', cleanupError);
      }
      
      await prisma.$disconnect();
      return res.status(500).json({
        error: 'Failed to create order',
        details: `Batch operation failed: ${batchError.message}`
      });
    }
    
    if (orderItems.length === 0) {
      console.error('Failed to create any order items');
      
      // Try to delete the order
      try {
        await prisma.retailOrder.delete({
          where: { id: newOrder.id }
        });
      } catch (deleteError) {
        console.error('Error deleting empty order:', deleteError);
      }
      
      await prisma.$disconnect();
      return res.status(500).json({
        error: 'Failed to create order items',
        details: 'No order items could be created'
      });
    }
    
    // Get the complete order
    let completeOrder;
    try {
      completeOrder = await prisma.retailOrder.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              coffee: {
                select: {
                  id: true,
                  name: true,
                  grade: true
                }
              }
            }
          },
          shop: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (lookupError) {
      console.error('Error looking up complete order:', lookupError);
      // Return what we have
      completeOrder = {
        ...newOrder,
        items: orderItems
      };
    }

    // Create activity log
    try {
      await createActivityLog(session.user.id, 'CREATE', 'RETAIL_ORDER', newOrder.id, {
        shopId: shopId,
        itemCount: orderItems.length,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.totalQuantity, 0)
      });
      console.log('Created activity log for order', newOrder.id);
    } catch (logError) {
      // Don't fail the request if activity log fails
      console.error('Failed to create activity log:', logError);
    }

    // Send email notification for new order (PENDING status)
    console.log(`[create-order] Sending email notifications for new order ${newOrder.id} with PENDING status`);
    try {
      const emailResult = await orderEmailService.sendOrderStatusChangeNotification(
        newOrder.id, 
        null, // No previous status for new orders
        'PENDING', 
        session.user.id
      );
      
      if (emailResult.success) {
        console.log(`[create-order] Email notifications sent successfully: ${emailResult.message}`);
      } else {
        console.log(`[create-order] Email notifications not sent: ${emailResult.error || emailResult.message}`);
      }
    } catch (emailError) {
      // Don't fail the entire operation if email sending fails
      console.error('[create-order] Error sending email notifications:', emailError);
    }

    // Send push notification for new order
    console.log(`[create-order] Sending push notifications for new order ${newOrder.id}`);
    try {
      const pushResult = await pushNotificationService.sendOrderNotification('NEW_ORDER', {
        orderId: newOrder.id,
        orderNumber: newOrder.id.slice(-8), // Use last 8 chars as order number
        shopId: newOrder.shopId,
        shopName: completeOrder.shop?.name || 'Unknown Shop',
        itemCount: newOrder.items?.length || 0,
        createdBy: session.user.username
      });
      
      if (pushResult.success) {
        console.log(`[create-order] Push notifications sent to ${pushResult.successful}/${pushResult.total} recipients`);
      } else {
        console.log(`[create-order] Push notifications not sent: ${pushResult.error}`);
      }
    } catch (pushError) {
      // Don't fail the entire operation if push notification fails
      console.error('[create-order] Error sending push notifications:', pushError);
    }

    // Make sure to disconnect the Prisma client
    await prisma.$disconnect();
    
    return res.status(200).json(completeOrder);
  } catch (error) {
    console.error('Unhandled error creating retail order:', error);
    // Try to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(500).json({ 
      error: 'Failed to create retail order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 