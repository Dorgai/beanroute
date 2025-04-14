import { verifyRequestAndGetUser } from '../../../../../lib/auth';
import { canManageShops } from '../../../../../lib/user-service';
import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Verify the user is authenticated
    const authenticatedUser = await verifyRequestAndGetUser(req, res);
    if (!authenticatedUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { shopId, userId } = req.query;
    if (!shopId || !userId) {
      return res.status(400).json({ message: 'Shop ID and User ID are required' });
    }

    // Handle DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      // Check if the user can manage shops
      const canManage = await canManageShops(authenticatedUser.id);
      if (!canManage) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to manage shops' });
      }

      // Check if both shop and user exist
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the user is assigned to the shop
      const existingAssignment = await prisma.userShop.findUnique({
        where: {
          userId_shopId: {
            userId,
            shopId,
          },
        },
      });

      if (!existingAssignment) {
        return res.status(404).json({ message: 'User is not assigned to this shop' });
      }

      // Delete the user-shop assignment
      await prisma.userShop.delete({
        where: {
          userId_shopId: {
            userId,
            shopId,
          },
        },
      });

      return res.status(200).json({
        message: 'User removed from shop'
      });
    }

    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in shop users API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
} 