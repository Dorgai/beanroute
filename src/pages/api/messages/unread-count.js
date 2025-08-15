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

    // Get all messages - no filtering, all users can see all messages
    const allMessages = await prisma.message.findMany({
      include: {
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });
    
    // Count unread messages for the current user
    const unreadCount = allMessages.filter(message => 
      !message.reads.some(read => read.userId === session.user.id)
    ).length;

    return res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 