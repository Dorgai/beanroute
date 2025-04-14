import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getUsers, canManageUsers } from '../../../lib/user-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate and get user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Authorization check (Example: only ADMIN/OWNER can list all users)
    // Adjust this check based on your actual permission requirements
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

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal server error fetching users' });
  }
} 