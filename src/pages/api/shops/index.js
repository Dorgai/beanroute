import { getUserFromRequest } from '../../../lib/auth';
import { getShops, createShop } from '../../../lib/shop-service';
import { canManageShops } from '../../../lib/user-service';

export default async function handler(req, res) {
  try {
    // Get the current user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Handle GET request - List shops
    if (req.method === 'GET') {
      const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
      
      const result = await getShops(
        parseInt(page), 
        parseInt(limit), 
        search,
        sortBy,
        sortOrder
      );
      
      return res.status(200).json(result);
    }
    
    // Handle POST request - Create a new shop
    if (req.method === 'POST') {
      // Check if user has permission to create shops
      if (!canManageShops(user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to create shops' });
      }
      
      const shopData = req.body;
      
      // Basic validation
      if (!shopData.name) {
        return res.status(400).json({ message: 'Shop name is required' });
      }
      
      const shop = await createShop(shopData, user.id);
      
      return res.status(201).json({
        message: 'Shop created successfully',
        shop,
      });
    }
    
    // Return 405 for other methods
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shops API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 