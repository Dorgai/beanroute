import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get retail inventory for the specified shop
    const inventory = await prisma.retailInventory.findMany({
      where: {
        shopId
      },
      include: {
        coffee: true,
        shop: true
      },
      orderBy: [
        {
          coffee: {
            grade: 'asc'
          }
        },
        {
          coffee: {
            name: 'asc'
          }
        }
      ]
    });

    // Group inventory by coffee grade
    const groupedInventory = inventory.reduce((acc, item) => {
      const grade = item.coffee.grade;
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(item);
      return acc;
    }, {});

    return res.status(200).json(groupedInventory);
  } catch (error) {
    console.error('Error fetching retail inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch retail inventory' });
  }
} 