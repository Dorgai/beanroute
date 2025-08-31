import { PrismaClient } from '@prisma/client';
import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getShop } from '../../../lib/shop-service';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(`[/api/shops/[shopId]] Handling ${req.method} request for shop ID: ${req.query.shopId}`);
  
  try {
    // Authenticate the user
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      console.log('[/api/shops/[shopId]] Authentication failed');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Only GET method is supported for this endpoint
    if (req.method === 'GET') {
      const shopId = req.query.shopId;
      
      if (!shopId) {
        console.log('[/api/shops/[shopId]] Missing shop ID in request');
        return res.status(400).json({ message: 'Shop ID is required' });
      }
      
      console.log(`[/api/shops/[shopId]] Fetching shop with ID: ${shopId}`);
      
      // Fetch shop details
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          name: true,
          address: true,
          minCoffeeQuantitySmall: true,
          minCoffeeQuantityLarge: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!shop) {
        console.log(`[/api/shops/[shopId]] Shop not found with ID: ${shopId}`);
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      console.log(`[/api/shops/[shopId]] Successfully retrieved shop: ${shop.name}`);
      return res.status(200).json(shop);
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[/api/shops/[shopId]] Error handling request:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  } finally {
    await prisma.$disconnect();
  }
} 