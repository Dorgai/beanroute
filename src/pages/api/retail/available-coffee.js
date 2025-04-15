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

    // Check if user has permission to view available coffee
    if (session.user.role === 'ROASTER') {
      return res.status(403).json({ error: 'Roasters cannot access retail ordering' });
    }

    // Get all available green coffee with quantity > 0
    const coffee = await prisma.greenCoffee.findMany({
      where: {
        quantity: {
          gt: 0
        }
      },
      orderBy: [
        {
          grade: 'asc'
        },
        {
          name: 'asc'
        }
      ]
    });

    // Group coffee by grade
    const groupedCoffee = coffee.reduce((acc, item) => {
      if (!acc[item.grade]) {
        acc[item.grade] = [];
      }
      acc[item.grade].push(item);
      return acc;
    }, {});

    return res.status(200).json(groupedCoffee);
  } catch (error) {
    console.error('Error fetching available coffee:', error);
    return res.status(500).json({ error: 'Failed to fetch available coffee' });
  }
} 