import { verifyRequestAndGetUser } from '../../../../../lib/auth';
import { updateUserRoleInShop, removeUserFromShop } from '../../../../../lib/shop-service';
import { logActivity } from '../../../../../lib/activity-service';
import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { shopId, userId } = req.query;
    
    if (!shopId || !userId) {
      return res.status(400).json({ message: 'Shop ID and User ID are required' });
    }

    // Only admins, owners, and managers can manage users
    const canManageUsers = ['ADMIN', 'OWNER', 'MANAGER'].includes(user.role);
    if (!canManageUsers) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    // PUT request - Update user role in shop
    if (req.method === 'PUT') {
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: 'Role is required' });
      }
      
      try {
        await updateUserRoleInShop(shopId, userId, role);
        return res.status(200).json({ message: 'User role updated successfully' });
      } catch (error) {
        console.error(`Error updating user ${userId} in shop ${shopId}:`, error);
        return res.status(500).json({ message: 'Error updating user role' });
      }
    }
    
    // DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      try {
        await removeUserFromShop(shopId, userId);
        return res.status(200).json({ message: 'User removed from shop successfully' });
      } catch (error) {
        console.error(`Error removing user ${userId} from shop ${shopId}:`, error);
        return res.status(500).json({ message: 'Error removing user from shop' });
      }
    }
    
    // Unsupported method
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Error in shop user management API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 