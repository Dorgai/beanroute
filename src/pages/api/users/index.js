import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getUsers, createUser, canManageUsers } from '../../../lib/user-service';
import { logActivity } from '../../../lib/activity-service';

export default async function handler(req, res) {
  try {
    // Authenticate and get user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Handle GET requests
    if (req.method === 'GET') {
      // Authorization check (Example: only ADMIN/OWNER can list all users)
      if (!canManageUsers(user.role)) { 
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view users.' });
      }

      // Get query parameters for pagination, sorting, filtering
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        role = '', 
        sortBy = 'username', 
        sortOrder = 'asc' 
      } = req.query;

      // Fetch users using the service function
      const result = await getUsers(
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        status,
        role,
        sortBy,
        sortOrder
      );

      return res.status(200).json(result);
    }
    
    // Handle POST requests - Create a new user
    else if (req.method === 'POST') {
      // Only admins and owners can create users
      if (!canManageUsers(user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to create users' });
      }
      
      const { username, password, email, firstName, lastName, role, status } = req.body;
      
      // Validate required fields
      if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Username is required' });
      }
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      try {
        // Create new user (email is optional now)
        // Handle both schema versions (email as required or optional)
        const userData = {
          username: username.trim(),
          password,
          firstName,
          lastName,
          role: role || 'BARISTA',
          status: status || 'ACTIVE'
        };
        
        // Only add email if provided (for schema where email is optional)
        // If schema still requires email, it will use empty string as fallback
        if (email && email.trim()) {
          userData.email = email.trim();
        } else {
          // For schemas that still require email, use a placeholder
          // This will be a temporary solution until migration is run
          userData.email = `${username.trim()}_${Date.now()}@placeholder.com`;
        }
        
        const newUser = await createUser(userData, user.id);
        
        // Log the activity
        await logActivity({
          userId: user.id,
          action: 'CREATE',
          resource: 'USER',
          resourceId: newUser.id,
          details: `Created user ${username}`
        }, req);
        
        // Remove sensitive data before returning
        const { password: _, ...userDataToReturn } = newUser;
        
        return res.status(201).json(userDataToReturn);
      } catch (error) {
        console.error('Error creating user:', error);
        
        // Handle unique constraint errors
        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0] || 'unknown';
          return res.status(409).json({ 
            message: `${field === 'username' ? 'Username' : 'Email'} already exists`,
            field
          });
        }
        
        return res.status(500).json({ message: 'Error creating user' });
      }
    }
    
    // Method not allowed
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 