import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getShopById, updateShop, deleteShop } from '../../../lib/shop-service';
import { Role } from '@prisma/client';

// Helper function for authorization check
function canModifyShop(user) {
  return [Role.ADMIN, Role.OWNER, Role.RETAILER].includes(user.role);
}

export default async function handler(req, res) {
  const { shopId } = req.query;

  if (!shopId || typeof shopId !== 'string') {
    return res.status(400).json({ message: 'Invalid shop ID' });
  }

  // Authenticate all requests for a specific shop
  const user = await verifyRequestAndGetUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // --- Handle GET Request --- 
  if (req.method === 'GET') {
    try {
      // Authorization: Any authenticated user can view a specific shop (adjust if needed)
      const shop = await getShopById(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      return res.status(200).json({ shop });
    } catch (error) {
      console.error(`Error fetching shop ${shopId}:`, error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // --- Handle PUT Request --- 
  if (req.method === 'PUT') {
    try {
      // Authorization: Check if user can modify shops
      if (!canModifyShop(user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const shopData = req.body;
      if (!shopData.name) {
        return res.status(400).json({ message: 'Shop name is required' });
      }

      const updatedShop = await updateShop(shopId, shopData);
      if (!updatedShop) { // Should not happen if ID is valid, but good check
          return res.status(404).json({ message: 'Shop not found during update' });
      }
      return res.status(200).json({ message: 'Shop updated successfully', shop: updatedShop });

    } catch (error) {
       console.error(`Error updating shop ${shopId}:`, error);
       if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
           return res.status(409).json({ message: 'A shop with this name already exists.' });
       }
       if (error.code === 'P2025') { // Record to update not found
           return res.status(404).json({ message: 'Shop not found' });
       }
       return res.status(500).json({ message: 'Internal server error updating shop' });
    }
  }

  // --- Handle DELETE Request --- 
  if (req.method === 'DELETE') {
      try {
          // Authorization: Check if user can modify shops
          if (!canModifyShop(user)) {
              return res.status(403).json({ message: 'Forbidden' });
          }

          await deleteShop(shopId);
          return res.status(204).end(); // No content

      } catch (error) {
          console.error(`Error deleting shop ${shopId}:`, error);
          if (error.code === 'P2025') { // Record to delete not found
             return res.status(404).json({ message: 'Shop not found' });
          }
          return res.status(500).json({ message: 'Internal server error deleting shop' });
      }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).json({ message: `Method ${req.method} Not Allowed` });
} 