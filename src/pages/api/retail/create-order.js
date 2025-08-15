// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { createActivityLog } from '@/lib/activity-service';
import orderEmailService from '@/lib/order-email-service';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  if (req.method !== 'POST') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
        largeBags: largeBags,
        totalQuantity: ((finalEspresso + finalFilter) * 0.2) + (largeBags * 1.0)
      };
    });
    
    const invalidItems = processedItems.filter(item => 
      !item.coffeeId || 
      (item.smallBagsEspresso <= 0 && item.smallBagsFilter <= 0 && item.largeBags <= 0)
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
    
    // Create each order item individually
    const orderItems = [];
    for (const item of processedItems) {
      try {
        console.log(`Adding item for order ${newOrder.id}, coffee ${item.coffeeId}, small: ${item.smallBags}, large: ${item.largeBags}, total: ${item.totalQuantity}kg`);
        
        const orderItem = await prisma.retailOrderItem.create({
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
        
        orderItems.push(orderItem);
        console.log(`Added order item: ${orderItem.id}`);
        
        // Update coffee quantity (reduce available)
        try {
          await prisma.greenCoffee.update({
            where: { id: item.coffeeId },
            data: {
              quantity: {
                decrement: item.totalQuantity
              }
            }
          });
          console.log(`Updated coffee ${item.coffeeId} quantity by -${item.totalQuantity}kg`);
        } catch (coffeeError) {
          console.error(`Error updating coffee quantity for ${item.coffeeId}:`, coffeeError);
          // Continue with other items
        }
        
        // Update retail inventory record
        try {
          const existingInventory = await prisma.retailInventory.findUnique({
            where: {
              shopId_coffeeId: {
                shopId,
                coffeeId: item.coffeeId
              }
            }
          });
          
          if (existingInventory) {
            await prisma.retailInventory.update({
              where: {
                id: existingInventory.id
              },
              data: {
                lastOrderDate: new Date()
              }
            });
          } else {
            await prisma.retailInventory.create({
              data: {
                shopId,
                coffeeId: item.coffeeId,
                smallBags: 0,
                largeBags: 0,
                totalQuantity: 0,
                lastOrderDate: new Date()
              }
            });
          }
          console.log(`Updated retail inventory for coffee ${item.coffeeId}`);
        } catch (inventoryError) {
          console.error(`Error updating retail inventory for ${item.coffeeId}:`, inventoryError);
          // Continue with other items
        }
      } catch (itemError) {
        console.error(`Error creating order item for coffee ${item.coffeeId}:`, itemError);
        // Continue with other items
      }
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