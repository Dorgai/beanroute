import { verifyRequestAndGetUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserStatus } from '@prisma/client';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify the request and get user (runs in Node.js runtime)
    const user = await verifyRequestAndGetUser(req);

    if (!user) {
      // If verification fails, return 401
      console.log('/api/dashboard/stats: Verification failed or no user found.');
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
    }

    // If verification succeeds, proceed to fetch stats
    console.log('/api/dashboard/stats: User verified, fetching stats for:', user.username);

    // Get dashboard statistics
    const [totalUsers, activeUsers, inactiveUsers, totalTeams, totalShops] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      prisma.team.count(),
      prisma.shop.count(),
    ]);
    
    console.log('/api/dashboard/stats: Stats fetched successfully:', { totalUsers, activeUsers, inactiveUsers, totalTeams, totalShops });

    // Return the statistics
    return res.status(200).json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTeams,
      totalShops,
      isDemo: false
    });
  } catch (error) {
    // Catch errors during the Prisma queries specifically
    console.error('/api/dashboard/stats: Error fetching stats:', error);
    return res.status(500).json({
      message: 'Internal server error while fetching stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 