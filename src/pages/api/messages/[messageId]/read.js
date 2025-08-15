import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messageId } = req.query;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user can see this message
    const canSeeMessage = () => {
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

    if (!canSeeMessage()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark message as read (upsert to avoid duplicates)
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId: messageId,
          userId: session.user.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId: messageId,
        userId: session.user.id,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 