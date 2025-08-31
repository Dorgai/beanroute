import { verifyRequestAndGetUser } from '../../../lib/auth';

// Force Node.js runtime for auth verification
export const runtime = 'nodejs';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check for direct access mode (for debugging)
    const bypassAuth = req.query.direct === 'true';
    
    // If using direct mode, return a mock admin session
    if (bypassAuth) {
      console.log('API session handler - using DIRECT ACCESS MODE with mock admin session');
      return res.status(200).json({
        user: {
          id: 'direct-access-admin-id',
          username: 'admin',
          email: 'admin@example.com',
          firstName: 'Direct',
          lastName: 'Access',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
    }
    
    // Get the current user using the auth verification function
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      return res.status(200).json({ user: null });
    }

    // Debug logging for role information
    console.log('API session handler - user role:', user.role);
    console.log('API session handler - user role type:', typeof user.role);
    console.log('API session handler - full user:', JSON.stringify(user, null, 2));

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