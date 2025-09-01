import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow ADMIN and OWNER roles
    if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
      await prisma.$disconnect();
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { shopId, coffeeId, smallBagsEspresso, smallBagsFilter, largeBags } = req.body;

    if (!shopId || !coffeeId) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Shop ID and Coffee ID are required' });
    }

    console.log(`[test-inventory-update] Testing inventory update for shop ${shopId}, coffee ${coffeeId}`);

    // Test 1: Check current inventory
    const currentInventory = await prisma.retailInventory.findUnique({
      where: {
        shopId_coffeeId: {
          shopId,
          coffeeId
        }
      }
    });

    console.log(`[test-inventory-update] Current inventory:`, currentInventory);

    // Test 2: Try to update inventory
    const testQuantity = {
      smallBagsEspresso: parseInt(smallBagsEspresso) || 5,
      smallBagsFilter: parseInt(smallBagsFilter) || 3,
      largeBags: parseInt(largeBags) || 1
    };

    const totalQuantity = (testQuantity.smallBagsEspresso * 0.2) + (testQuantity.smallBagsFilter * 0.2) + (testQuantity.largeBags * 1.0);

    console.log(`[test-inventory-update] Testing with quantities:`, testQuantity, `Total: ${totalQuantity}kg`);

    const updatedInventory = await prisma.retailInventory.upsert({
      where: {
        shopId_coffeeId: {
          shopId,
          coffeeId
        }
      },
      create: {
        shopId,
        coffeeId,
        smallBagsEspresso: testQuantity.smallBagsEspresso,
        smallBagsFilter: testQuantity.smallBagsFilter,
        largeBags: testQuantity.largeBags,
        totalQuantity,
        lastOrderDate: new Date()
      },
      update: {
        smallBagsEspresso: {
          increment: testQuantity.smallBagsEspresso
        },
        smallBagsFilter: {
          increment: testQuantity.smallBagsFilter
        },
        largeBags: {
          increment: testQuantity.largeBags
        },
        totalQuantity: {
          increment: totalQuantity
        },
        lastOrderDate: new Date()
      }
    });

    console.log(`[test-inventory-update] Successfully updated inventory:`, updatedInventory);

    // Test 3: Verify the update
    const verifyInventory = await prisma.retailInventory.findUnique({
      where: {
        shopId_coffeeId: {
          shopId,
          coffeeId
        }
      }
    });

    console.log(`[test-inventory-update] Verification - updated inventory:`, verifyInventory);

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Inventory update test completed successfully',
      before: currentInventory,
      testQuantities: testQuantity,
      after: verifyInventory
    });

  } catch (error) {
    console.error('[test-inventory-update] Error:', error);
    await prisma.$disconnect();
    return res.status(500).json({
      error: 'Inventory update test failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
