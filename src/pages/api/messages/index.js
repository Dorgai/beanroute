import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

// Message board API - Production deployment fix
export default async function handler(req, res) {
  const prisma = new PrismaClient();

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all messages with sender and read information
      const messages = await prisma.message.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ messages });
    }

    if (req.method === 'POST') {
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          senderId: session.user.id,
        },
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

      return res.status(201).json({ message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 