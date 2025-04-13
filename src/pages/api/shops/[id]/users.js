import { getUserFromRequest } from '../../../../lib/auth';
import { getShopById, addUserToShop, removeUserFromShop, updateUserRoleInShop } from '../../../../lib/shop-service';
import { canManageShops } from '../../../../lib/user-service';

export default async function handler(req, res) {
  try {
    // Get current user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get shop ID from query
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }
    
    // Verify shop exists
    const shop = await getShopById(id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Check if user has permission to manage this shop
    if (!canManageShops(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions to manage shop users' });
    }
    
    // Handle POST request - Add user to shop
    if (req.method === 'POST') {
      const { userId, role } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const userShop = await addUserToShop(userId, id, role || 'BARISTA');
      
      return res.status(201).json({
        message: 'User added to shop successfully',
        userShop,
      });
    }
    
    // Handle PUT request - Update user role in shop
    if (req.method === 'PUT') {
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
      }
      
      // Only ADMIN or OWNER can assign OWNER or RETAILER roles
      const isElevatedRole = role === 'OWNER' || role === 'RETAILER';
      if (isElevatedRole && user.role !== 'ADMIN' && user.role !== 'OWNER') {
        return res.status(403).json({ 
          message: 'Forbidden: Only Admins and Owners can assign Owner or Retailer roles'
        });
      }
      
      const updatedUserShop = await updateUserRoleInShop(userId, id, role);
      
      return res.status(200).json({
        message: 'User role updated successfully',
        userShop: updatedUserShop,
      });
    }
    
    // Handle DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      await removeUserFromShop(userId, id);
      
      return res.status(200).json({
        message: 'User removed from shop successfully',
      });
    }
    
    // Return 405 for other methods
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shop users API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 