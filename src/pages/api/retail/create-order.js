import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';
import { createActivityLog } from '@/lib/activity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to create retail orders
    if (session.user.role === 'ROASTER') {
      return res.status(403).json({ error: 'Roasters cannot create retail orders' });
    }

    const { shopId, items } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Start a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the retail order
      const order = await tx.retailOrder.create({
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

      // Update or create retail inventory records
      for (const item of items) {
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
            smallBags: item.smallBags || 0,
            largeBags: item.largeBags || 0,
            totalQuantity: (item.smallBags * 0.25) + (item.largeBags * 1.0),
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
              increment: (item.smallBags * 0.25) + (item.largeBags * 1.0)
            },
            lastOrderDate: new Date()
          }
        });

        // Update green coffee inventory
        await tx.greenCoffee.update({
          where: { id: item.coffeeId },
          data: {
            quantity: {
              decrement: (item.smallBags * 0.25) + (item.largeBags * 1.0)
            }
          }
        });
      }

      return order;
    });

    // Create activity log
    await createActivityLog(session.user.id, 'CREATE', 'RETAIL_ORDER', order.id, {
      shopId: order.shopId,
      itemCount: order.items.length,
      totalQuantity: order.items.reduce((sum, item) => sum + item.totalQuantity, 0)
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error('Error creating retail order:', error);
    return res.status(500).json({ error: 'Failed to create retail order' });
  }
} 