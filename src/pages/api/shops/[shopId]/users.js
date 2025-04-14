import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getShopById, addUserToShop, removeUserFromShop, updateUserRoleInShop, getShopUsers } from '../../../../lib/shop-service';

export default async function handler(req, res) {
  try {
    // Get current user with the correct function that works in API routes
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get shop ID from query - using shopId to match the file naming
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }
    
    // Verify shop exists
    const shop = await getShopById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Deny access to ROASTER role users
    if (user.role === 'ROASTER') {
      return res.status(403).json({ message: 'Forbidden: Roasters cannot manage shop users' });
    }
    
    // Handle GET request - Fetch users assigned to shop
    if (req.method === 'GET') {
      // Fetch users assigned to this shop
      const shopUsers = await getShopUsers(shopId);
      
      return res.status(200).json(shopUsers);
    }
    
    // Handle POST request - Add user to shop
    if (req.method === 'POST') {
      const { userId, role } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const userShop = await addUserToShop(userId, shopId, role || 'BARISTA');
      
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
      
      const updatedUserShop = await updateUserRoleInShop(userId, shopId, role);
      
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
      
      await removeUserFromShop(userId, shopId);
      
      return res.status(200).json({
        message: 'User removed from shop successfully',
      });
    }
    
    // Return 405 for other methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shop users API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 