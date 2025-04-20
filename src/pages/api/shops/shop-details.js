import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';
import { verifyRequestAndGetUser } from '../../../lib/auth';
import { updateShop, deleteShop } from '../../../lib/shop-service';
import { Role } from '@prisma/client';

// Single instance to avoid too many connections
let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

// Helper function for authorization check
function canModifyShop(user) {
  return [Role.ADMIN, Role.OWNER, Role.RETAILER].includes(user.role);
}

export default async function handler(req, res) {
  console.log('[api/shops/shop-details] Processing request, method:', req.method);
  
  try {
    // Create Prisma instance
    const prisma = getPrismaInstance();
    
    // GET method - Fetch shop details
    if (req.method === 'GET') {
      // Validate session (check for query param direct access)
      const bypassAuth = req.query.direct === 'true';
      let user;

      if (!bypassAuth) {
        // Use cookies from req for authentication
        if (req.cookies?.auth) {
          console.log('[api/shops/shop-details] Auth cookie found in request');
          user = await verifyRequestAndGetUser(req);
        } else {
          console.log('[api/shops/shop-details] Trying session-based auth');
          user = await getServerSession(req, res);
        }

        if (!user) {
          console.log('[api/shops/shop-details] No authenticated user found');
          return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('[api/shops/shop-details] Authenticated user:', user.username || user.id);
      } else {
        console.log('[api/shops/shop-details] AUTH BYPASS MODE - Skipping authentication check');
      }

      const id = req.query.id;
      if (!id) {
        console.log('[api/shops/shop-details] Missing shop ID');
        return res.status(400).json({ error: 'Shop ID is required as a query parameter' });
      }
      
      console.log('[api/shops/shop-details] Fetching shop details for ID:', id);

      // Fetch shop details with the specified ID
      const shop = await prisma.shop.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          address: true,
          minCoffeeQuantitySmall: true,
          minCoffeeQuantityLarge: true,
        },
      });

      if (!shop) {
        console.log('[api/shops/shop-details] Shop not found for ID:', id);
        return res.status(404).json({ error: 'Shop not found' });
      }

      console.log('[api/shops/shop-details] Successfully retrieved shop:', shop.name);
      return res.status(200).json(shop);
    } 
    // PUT method - Update shop
    else if (req.method === 'PUT') {
      // Authenticate the request
      const user = await verifyRequestAndGetUser(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user can modify shops
      if (!canModifyShop(user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const shopId = req.query.id;
      if (!shopId) {
        return res.status(400).json({ message: 'Shop ID is required' });
      }

      const shopData = req.body;
      if (!shopData.name) {
        return res.status(400).json({ message: 'Shop name is required' });
      }

      try {
        const updatedShop = await updateShop(shopId, shopData);
        if (!updatedShop) {
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
        throw error;
      }
    }
    // DELETE method - Delete shop
    else if (req.method === 'DELETE') {
      // Authenticate the request
      const user = await verifyRequestAndGetUser(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Check if user can modify shops
      if (!canModifyShop(user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const shopId = req.query.id;
      if (!shopId) {
        return res.status(400).json({ message: 'Shop ID is required' });
      }

      try {
        await deleteShop(shopId);
        return res.status(204).end(); // No content
      } catch (error) {
        console.error(`Error deleting shop ${shopId}:`, error);
        if (error.code === 'P2025') { // Record to delete not found
          return res.status(404).json({ message: 'Shop not found' });
        }
        throw error;
      }
    }
    // Method not allowed
    else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling shop request:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 