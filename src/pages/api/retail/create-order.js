// Direct Prisma client implementation for better reliability
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { createActivityLog } from '@/lib/activity-service';

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

    const { shopId, items } = req.body;
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

    // Validate each item has a valid coffeeId and at least one bag
    const invalidItems = items.filter(item => 
      !item.coffeeId || 
      ((!item.smallBags || item.smallBags <= 0) && 
       (!item.largeBags || item.largeBags <= 0))
    );

    if (invalidItems.length > 0) {
      await prisma.$disconnect();
      return res.status(400).json({ 
        error: 'Invalid items in order', 
        details: invalidItems.map(item => item.coffeeId || 'unknown')
      });
    }

    // Start a transaction with comprehensive error handling
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        console.log('Starting transaction for order creation');
        
        // Create the retail order
        const newOrder = await tx.retailOrder.create({
          data: {
            shopId,
            orderedById: session.user.id,
            status: 'PENDING',
            items: {
              create: items.map(item => ({
                coffeeId: item.coffeeId,
                smallBags: item.smallBags || 0,
                largeBags: item.largeBags || 0,
                totalQuantity: (item.smallBags * 0.25) + (item.largeBags * 1.0) // Convert to kg
              }))
            }
          },
          include: {
            items: {
              include: {
                coffee: true
              }
            },
            shop: true
          }
        });
        console.log('Created order:', newOrder.id);

        // Verify each coffee exists and has sufficient quantity - but don't update inventory yet
        // We will only update inventory when the order is delivered
        for (const item of items) {
          // Calculate kg weight
          const totalKg = (item.smallBags * 0.25) + (item.largeBags * 1.0);
          
          console.log(`Checking availability for coffee ${item.coffeeId}, requested ${totalKg}kg`);
          
          // Create a record in RetailInventory if it doesn't exist yet (with zero quantities)
          // This allows tracking the last order date without updating quantities
          await tx.retailInventory.upsert({
            where: {
              shopId_coffeeId: {
                shopId,
                coffeeId: item.coffeeId
              }
            },
            create: {
              shopId,
              coffeeId: item.coffeeId,
              smallBags: 0,
              largeBags: 0,
              totalQuantity: 0,
              lastOrderDate: new Date()
            },
            update: {
              lastOrderDate: new Date()
            }
          });

          // Verify coffee exists and has sufficient quantity
          const coffee = await tx.greenCoffee.findUnique({
            where: { id: item.coffeeId }
          });
          
          if (!coffee) {
            throw new Error(`Coffee with ID ${item.coffeeId} not found`);
          }
          
          if (coffee.quantity < totalKg) {
            throw new Error(`Insufficient quantity for coffee ${coffee.name} (ID: ${item.coffeeId}). Available: ${coffee.quantity}kg, Requested: ${totalKg}kg`);
          }
          
          // Reserve the coffee by reducing the available quantity
          // This ensures the same coffee isn't oversold before delivery
          await tx.greenCoffee.update({
            where: { id: item.coffeeId },
            data: {
              quantity: {
                decrement: totalKg
              }
            }
          });
          console.log(`Reserved coffee ${item.coffeeId} quantity by ${totalKg}kg`);
        }

        return newOrder;
      });
      console.log('Transaction completed successfully');
    } catch (dbError) {
      console.error('Database error creating order:', dbError);
      await prisma.$disconnect();
      return res.status(500).json({ 
        error: 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? dbError.message : 'Database transaction failed'
      });
    }

    // Create activity log
    try {
      await createActivityLog(session.user.id, 'CREATE', 'RETAIL_ORDER', order.id, {
        shopId: order.shopId,
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.totalQuantity, 0)
      });
      console.log('Created activity log for order', order.id);
    } catch (logError) {
      // Don't fail the request if activity log fails
      console.error('Failed to create activity log:', logError);
    }

    // Make sure to disconnect the Prisma client
    await prisma.$disconnect();
    
    return res.status(200).json(order);
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