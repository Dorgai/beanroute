import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get basic user information (id, username) for all active users
    // This is needed for the message board to show who has read messages
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        username: true,
      },
      orderBy: {
        username: 'asc'
      }
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching basic user info:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 