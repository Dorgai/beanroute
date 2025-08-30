import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import pushNotificationService from '@/lib/push-notification-service';

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

      // Send push notifications for new message
      console.log(`[messages] Sending push notifications for new message by ${session.user.username}`);
      try {
        // Check for mentions in the message
        const mentionMatches = content.match(/@(\w+)/g);
        const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;

        if (mentionMatches && mentionMatches.length > 0) {
          // Send mention notifications to specific users
          console.log(`[messages] Found mentions: ${mentionMatches.join(', ')}`);
          
          for (const mention of mentionMatches) {
            const username = mention.replace('@', '');
            
            // Find mentioned user
            const mentionedUser = await prisma.user.findUnique({
              where: { username },
              select: { id: true }
            });
            
            if (mentionedUser && mentionedUser.id !== session.user.id) {
              // Don't notify yourself
              const pushResult = await pushNotificationService.sendMessageNotification('MENTION', {
                messageId: message.id,
                senderName: session.user.username,
                messagePreview,
                mentionedUsername: username
              }, [mentionedUser.id]);
              
              if (pushResult.success) {
                console.log(`[messages] Mention notification sent to ${username}`);
              }
            }
          }
        } else {
          // Send general new message notification (exclude sender)
          const allUsers = await prisma.user.findMany({
            where: { 
              status: 'ACTIVE',
              id: { not: session.user.id } // Exclude sender
            },
            select: { id: true }
          });
          
          if (allUsers.length > 0) {
            const userIds = allUsers.map(u => u.id);
            const pushResult = await pushNotificationService.sendMessageNotification('NEW_MESSAGE', {
              messageId: message.id,
              senderName: session.user.username,
              messagePreview
            }, userIds);
            
            if (pushResult.success) {
              console.log(`[messages] New message notifications sent to ${pushResult.successful}/${pushResult.total} users`);
            }
          }
        }
      } catch (pushError) {
        // Don't fail message creation if push notifications fail
        console.error('[messages] Error sending push notifications:', pushError);
      }

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