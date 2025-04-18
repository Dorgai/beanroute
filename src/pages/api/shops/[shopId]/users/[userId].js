import { verifyRequestAndGetUser } from '../../../../../lib/auth';
import { updateUserRoleInShop, removeUserFromShop } from '../../../../../lib/shop-service';
import { logActivity } from '../../../../../lib/activity-service';

export default async function handler(req, res) {
  console.log(`[shop-user-api] Starting request for shop user management: ${req.method}`);
  console.log(`[shop-user-api] Parameters: shopId=${req.query.shopId}, userId=${req.query.userId}`);
  
  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      console.log('[shop-user-api] Authentication failed');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { shopId, userId } = req.query;
    
    if (!shopId || !userId) {
      console.log('[shop-user-api] Missing required parameters');
      return res.status(400).json({ message: 'Shop ID and User ID are required' });
    }

    console.log(`[shop-user-api] User ${user.id} (${user.role}) attempting to manage user ${userId} in shop ${shopId}`);

    // Only admins, owners, and managers can manage users
    const canManageUsers = ['ADMIN', 'OWNER', 'MANAGER'].includes(user.role);
    if (!canManageUsers) {
      console.log(`[shop-user-api] Permission denied for user role: ${user.role}`);
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    // PUT request - Update user role in shop
    if (req.method === 'PUT') {
      const { role } = req.body;
      
      if (!role) {
        console.log('[shop-user-api] Role is missing from request body');
        return res.status(400).json({ message: 'Role is required' });
      }
      
      try {
        console.log(`[shop-user-api] Updating role for user ${userId} in shop ${shopId} to ${role}`);
        // Note: Parameter order is userId, shopId, role
        const result = await updateUserRoleInShop(userId, shopId, role);
        
        await logActivity({
          userId: user.id,
          action: 'UPDATE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Updated role for user ${userId} in shop ${shopId} to ${role}`
        });
        
        console.log('[shop-user-api] User role updated successfully');
        return res.status(200).json({ 
          message: 'User role updated successfully',
          result
        });
      } catch (error) {
        console.error(`[shop-user-api] Error updating user ${userId} in shop ${shopId}:`, error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User not found in shop' });
        }
        
        return res.status(500).json({ 
          message: 'Error updating user role',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    
    // DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      try {
        console.log(`[shop-user-api] Removing user ${userId} from shop ${shopId}`);
        // Note: Parameter order is userId, shopId
        const result = await removeUserFromShop(userId, shopId);
        
        await logActivity({
          userId: user.id,
          action: 'REMOVE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Removed user ${userId} from shop ${shopId}`
        });
        
        console.log('[shop-user-api] User removed from shop successfully');
        return res.status(200).json({ 
          message: 'User removed from shop successfully',
          result
        });
      } catch (error) {
        console.error(`[shop-user-api] Error removing user ${userId} from shop ${shopId}:`, error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User not found in shop' });
        }
        
        return res.status(500).json({ 
          message: 'Error removing user from shop',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    
    // Unsupported method
    console.log(`[shop-user-api] Unsupported method: ${req.method}`);
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('[shop-user-api] Error in shop user management API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 