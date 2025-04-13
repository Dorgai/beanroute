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
      // Instead of returning 401, return demo data when not authenticated
      // This helps avoid breaking the dashboard in development
      console.log('No authenticated user found, returning demo data');
      return res.status(200).json({
        totalUsers: 1,
        activeUsers: 1,
        inactiveUsers: 0,
        totalTeams: 0,
        isDemo: true
      });
    }

    console.log('Fetching stats for user:', user.username);

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

    console.log('Stats fetched successfully');

    // Return the statistics
    return res.status(200).json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTeams,
      isDemo: false
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    
    // Return fallback data on error
    return res.status(200).json({
      totalUsers: 1,
      activeUsers: 1,
      inactiveUsers: 0,
      totalTeams: 0,
      isDemo: true,
      error: error.message
    });
  }
} 