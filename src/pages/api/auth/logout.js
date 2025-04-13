import { removeAuthCookie, verifyRequestAndGetUser, logUserActivity } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current user using the correct function
    const user = await verifyRequestAndGetUser(req);
    
    if (user) {
      // Log user activity
      await logUserActivity(user.id, 'logout', {}, req);
      
      // Delete the current session if token is available
      const token = req.cookies?.auth;
      if (token) {
        await prisma.session.deleteMany({
          where: {
            userId: user.id,
            token,
          },
        });
      }
    }
    
    // Remove the auth cookie
    removeAuthCookie(res);
    
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still remove the cookie even if there's an error
    removeAuthCookie(res);
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 