import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getShops, createShop } from '../../../lib/shop-service';
import { Role } from '@prisma/client';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {

  // Authenticate all requests first
  const user = await verifyRequestAndGetUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      // Authorization check (Example: Any authenticated user can view shops)
      // No specific role check here, but could add if needed
      
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await getShops(parseInt(page, 10), parseInt(limit, 10), search);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error fetching shops:', error);
      return res.status(500).json({ message: 'Internal server error fetching shops' });
    }
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      // Authorization check (Example: ADMIN, OWNER, RETAILER can create)
      if (![Role.ADMIN, Role.OWNER, Role.RETAILER].includes(user.role)) { 
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to create shops.' });
      }

      console.log('User attempting to create shop:', { 
        userId: user.id, 
        role: user.role,
        shopData: req.body 
      });

      const shopData = req.body;
      // Basic validation
      if (!shopData.name) {
        return res.status(400).json({ message: 'Shop name is required' });
      }
      
      // Use the authenticated user's ID as the creator
      const shop = await createShop(shopData, user.id);
      
      return res.status(201).json({
        message: 'Shop created successfully',
        shop,
      });

    } catch (error) {
       console.error('Error creating shop:', error);
       console.error('Detailed shop creation error:', {
         message: error.message,
         stack: error.stack,
         code: error.code,
         meta: error.meta,
         name: error.name
       });
       
       // Handle potential unique constraint errors, etc.
       if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
           return res.status(409).json({ message: 'A shop with this name already exists.' });
       }
       return res.status(500).json({ 
         message: 'Internal server error creating shop',
         details: process.env.NODE_ENV === 'development' ? error.message : undefined
       });
    }
  }

  // Method not allowed for others
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
} 