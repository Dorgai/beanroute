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

    // Get all messages that the user can see
    const allMessages = await prisma.message.findMany({
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });

    // Filter messages based on user permissions
    const canSeeMessage = (message) => {
      // Admin and owner can see all messages
      if (session.user.role === 'ADMIN' || session.user.role === 'OWNER') {
        return true;
      }

      // Check if message is addressed to current user
      const mentionedUsers = message.content.match(/@(\w+)/g);
      if (mentionedUsers) {
        return mentionedUsers.some(mention => 
          mention.toLowerCase() === `@${session.user.username.toLowerCase()}`
        );
      }

      return false;
    };

    const visibleMessages = allMessages.filter(canSeeMessage);
    
    // Count unread messages
    const unreadCount = visibleMessages.filter(message => 
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
