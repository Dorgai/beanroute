import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getShopById, addUserToShop, removeUserFromShop, updateUserRoleInShop, getShopUsers } from '../../../../lib/shop-service';
import { logActivity } from '../../../../lib/activity-service';

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
      
      try {
        const userShop = await addUserToShop(userId, shopId, role || 'BARISTA');
        
        // Log the activity
        await logActivity({
          userId: user.id, 
          action: 'ASSIGN',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `User ${userId} assigned to shop ${shopId} with role ${role || 'BARISTA'}`
        });
        
        return res.status(201).json({
          message: 'User added to shop successfully',
          userShop,
        });
      } catch (error) {
        console.error('Error adding user to shop:', error);
        if (error.code === 'P2002') {
          return res.status(409).json({ message: 'User is already assigned to this shop' });
        }
        throw error;
      }
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
      
      try {
        const updatedUserShop = await updateUserRoleInShop(userId, shopId, role);
        
        // Log the activity
        await logActivity({
          userId: user.id,
          action: 'UPDATE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Updated role for user ${userId} in shop ${shopId} to ${role}`
        });
        
        return res.status(200).json({
          message: 'User role updated successfully',
          userShop: updatedUserShop,
        });
      } catch (error) {
        console.error('Error updating user role:', error);
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User is not assigned to this shop' });
        }
        throw error;
      }
    }
    
    // Handle DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      try {
        await removeUserFromShop(userId, shopId);
        
        // Log the activity
        await logActivity({
          userId: user.id,
          action: 'REMOVE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Removed user ${userId} from shop ${shopId}`
        });
        
        return res.status(200).json({
          message: 'User removed from shop successfully',
        });
      } catch (error) {
        console.error('Error removing user from shop:', error);
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User is not assigned to this shop' });
        }
        throw error;
      }
    }
    
    // Return 405 for other methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shop users API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 