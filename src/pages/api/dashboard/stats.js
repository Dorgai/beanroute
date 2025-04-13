import { getUserFromRequest } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get dashboard statistics
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTeams
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.team.count()
    ]);

    // Return the statistics
    return res.status(200).json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTeams
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 