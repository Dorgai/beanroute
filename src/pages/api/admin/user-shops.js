import { verifyRequestAndGetUser } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow admin users to access this endpoint
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    // Get all users with their shop assignments
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching user-shop assignments:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  } finally {
    await prisma.$disconnect();
  }
} 