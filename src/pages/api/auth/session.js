import { verifyRequestAndGetUser } from '../../../lib/auth';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current user using the auth verification function
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      return res.status(200).json({ user: null });
    }

    // Return user data (excluding sensitive fields)
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 