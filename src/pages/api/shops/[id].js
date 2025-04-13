import { getUserFromRequest } from '../../../lib/auth';
import { getShopById, updateShop, deleteShop } from '../../../lib/shop-service';
import { canManageShops } from '../../../lib/user-service';

export default async function handler(req, res) {
  try {
    // Get the current user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get shop ID from query
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }
    
    // Handle GET request - Get shop by ID
    if (req.method === 'GET') {
      const shop = await getShopById(id);
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      return res.status(200).json(shop);
    }
    
    // For PUT and DELETE methods, check if user has permission
    if ((req.method === 'PUT' || req.method === 'DELETE') && !canManageShops(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions to manage shops' });
    }
    
    // Handle PUT request - Update shop
    if (req.method === 'PUT') {
      const shopData = req.body;
      
      // Basic validation
      if (!shopData.name) {
        return res.status(400).json({ message: 'Shop name is required' });
      }
      
      const shop = await updateShop(id, shopData);
      
      return res.status(200).json({
        message: 'Shop updated successfully',
        shop,
      });
    }
    
    // Handle DELETE request - Delete shop
    if (req.method === 'DELETE') {
      // Only ADMIN and OWNER can delete shops
      if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
        return res.status(403).json({ message: 'Forbidden: Only Admins and Owners can delete shops' });
      }
      
      await deleteShop(id);
      
      return res.status(200).json({
        message: 'Shop deleted successfully',
      });
    }
    
    // Return 405 for other methods
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shop API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 