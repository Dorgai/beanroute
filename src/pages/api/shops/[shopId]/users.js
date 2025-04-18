import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getShopById, addUserToShop, removeUserFromShop, updateUserRoleInShop, getShopUsers } from '../../../../lib/shop-service';
import { logActivity } from '../../../../lib/activity-service';
import { getUsersForShop } from '../../../../lib/user-service';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  console.log(`[shop-users-api] Method: ${req.method}, ShopId: ${req.query.shopId}`);
  const prisma = new PrismaClient();
  
  try {
    // Get current user with the correct function that works in API routes
    let user;
    try {
      console.log('[shop-users-api] Verifying user authentication');
      user = await verifyRequestAndGetUser(req);
      
      if (!user) {
        console.log('[shop-users-api] User authentication failed');
        return res.status(401).json({ message: 'Unauthorized - Authentication failed' });
      }
      
      console.log(`[shop-users-api] User authenticated: ${user.id}, role: ${user.role}`);
    } catch (authError) {
      console.error('[shop-users-api] Authentication error:', authError);
      return res.status(401).json({ 
        message: 'Authentication error',
        details: authError.message
      });
    }
    
    // Get shop ID from query - using shopId to match the file naming
    const { shopId } = req.query;
    
    if (!shopId) {
      console.log('[shop-users-api] Shop ID is missing');
      return res.status(400).json({ message: 'Shop ID is required' });
    }
    
    // Verify shop exists
    let shop;
    try {
      console.log(`[shop-users-api] Fetching shop with ID: ${shopId}`);
      // Use a simpler shop fetch to avoid schema issues
      shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          name: true,
          createdById: true
        }
      });
      
      if (!shop) {
        console.log(`[shop-users-api] Shop not found with ID: ${shopId}`);
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      console.log(`[shop-users-api] Found shop: ${shop.name} (${shop.id})`);
    } catch (shopError) {
      console.error('[shop-users-api] Error fetching shop:', shopError);
      return res.status(500).json({ 
        message: 'Error fetching shop',
        details: shopError.message
      });
    }
    
    // Check permissions - ADMIN, OWNER, RETAILER can view shop users
    // BARISTA and ROASTER cannot
    if (!['ADMIN', 'OWNER', 'RETAILER'].includes(user.role)) {
      console.log(`[shop-users-api] User role ${user.role} is not allowed to manage shop users`);
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions to manage shop users' });
    }
    
    // Handle GET request - Fetch users assigned to shop
    if (req.method === 'GET') {
      try {
        console.log(`[shop-users-api] Fetching users for shop ${shopId}`);
        
        // Use direct Prisma query for more control over fields
        const userShops = await prisma.userShop.findMany({
          where: { shopId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        });
        
        console.log(`[shop-users-api] Found ${userShops.length} users for shop ${shopId}`);
        
        // Format response to match expected structure
        const formattedUsers = userShops.map(us => ({
          userId: us.userId,
          shopId: us.shopId,
          role: us.role,
          user: us.user
        }));
        
        // Add more details for debugging
        const userSummary = formattedUsers.map(u => ({
          userId: u.userId,
          username: u.user?.username || 'unknown',
          role: u.role
        }));
        console.log('[shop-users-api] User summary:', JSON.stringify(userSummary));
        
        return res.status(200).json(formattedUsers);
      } catch (error) {
        console.error(`[shop-users-api] Error getting users for shop ${shopId}:`, error);
        return res.status(500).json({ 
          message: 'Error getting users for shop',
          details: error.message,
          stack: error.stack
        });
      }
    }
    
    // Handle POST request - Add user to shop
    if (req.method === 'POST') {
      try {
        console.log('[shop-users-api] Processing POST request, body:', req.body);
        const { userId, role } = req.body;
        
        if (!userId) {
          console.log('[shop-users-api] User ID is missing in request body');
          return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Only ADMIN, OWNER can add RETAILER/OWNER roles
        const requestedRole = role || 'BARISTA';
        const isElevatedRole = ['OWNER', 'RETAILER'].includes(requestedRole);
        
        if (isElevatedRole && user.role !== 'ADMIN' && user.role !== 'OWNER') {
          console.log(`[shop-users-api] User ${user.id} (${user.role}) cannot assign role ${requestedRole}`);
          return res.status(403).json({ 
            message: 'Forbidden: Only Admins and Owners can assign Owner or Retailer roles'
          });
        }
        
        console.log(`[shop-users-api] Adding user ${userId} to shop ${shopId} with role ${requestedRole}`);
        const userShop = await addUserToShop(userId, shopId, requestedRole);
        
        // Log the activity
        await logActivity({
          userId: user.id, 
          action: 'ASSIGN',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `User ${userId} assigned to shop ${shopId} with role ${requestedRole}`
        });
        
        console.log(`[shop-users-api] Successfully added user ${userId} to shop ${shopId}`);
        return res.status(201).json({
          message: 'User added to shop successfully',
          userShop,
        });
      } catch (error) {
        console.error('[shop-users-api] Error adding user to shop:', error);
        
        if (error.code === 'P2002') {
          return res.status(409).json({ message: 'User is already assigned to this shop' });
        }
        
        if (error.code === 'P2003') {
          return res.status(404).json({ message: 'User or shop not found' });
        }
        
        return res.status(500).json({ 
          message: 'Error adding user to shop',
          details: error.message,
          code: error.code,
          stack: error.stack
        });
      }
    }
    
    // Handle PUT request - Update user role in shop
    if (req.method === 'PUT') {
      try {
        console.log('[shop-users-api] Processing PUT request, body:', req.body);
        const { userId, role } = req.body;
        
        if (!userId || !role) {
          console.log('[shop-users-api] Missing required fields for PUT request');
          return res.status(400).json({ message: 'User ID and role are required' });
        }
        
        // Only ADMIN or OWNER can assign OWNER or RETAILER roles
        const isElevatedRole = role === 'OWNER' || role === 'RETAILER';
        if (isElevatedRole && user.role !== 'ADMIN' && user.role !== 'OWNER') {
          console.log(`[shop-users-api] User ${user.id} (${user.role}) cannot assign role ${role}`);
          return res.status(403).json({ 
            message: 'Forbidden: Only Admins and Owners can assign Owner or Retailer roles'
          });
        }
        
        console.log(`[shop-users-api] Updating role for user ${userId} in shop ${shopId} to ${role}`);
        const updatedUserShop = await updateUserRoleInShop(userId, shopId, role);
        
        // Log the activity
        await logActivity({
          userId: user.id,
          action: 'UPDATE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Updated role for user ${userId} in shop ${shopId} to ${role}`
        });
        
        console.log(`[shop-users-api] Successfully updated role for user ${userId} to ${role}`);
        return res.status(200).json({
          message: 'User role updated successfully',
          userShop: updatedUserShop,
        });
      } catch (error) {
        console.error('[shop-users-api] Error updating user role:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User is not assigned to this shop' });
        }
        
        return res.status(500).json({ 
          message: 'Error updating user role',
          details: error.message,
          code: error.code,
          stack: error.stack
        });
      }
    }
    
    // Handle DELETE request - Remove user from shop
    if (req.method === 'DELETE') {
      try {
        console.log('[shop-users-api] Processing DELETE request, body:', req.body);
        const { userId } = req.body;
        
        if (!userId) {
          console.log('[shop-users-api] User ID missing for DELETE request');
          return res.status(400).json({ message: 'User ID is required' });
        }
        
        console.log(`[shop-users-api] Removing user ${userId} from shop ${shopId}`);
        await removeUserFromShop(userId, shopId);
        
        // Log the activity
        await logActivity({
          userId: user.id,
          action: 'REMOVE',
          resource: 'SHOP_USER',
          resourceId: shopId,
          details: `Removed user ${userId} from shop ${shopId}`
        });
        
        console.log(`[shop-users-api] Successfully removed user ${userId} from shop ${shopId}`);
        return res.status(200).json({
          message: 'User removed from shop successfully',
        });
      } catch (error) {
        console.error('[shop-users-api] Error removing user from shop:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'User is not assigned to this shop' });
        }
        
        return res.status(500).json({ 
          message: 'Error removing user from shop',
          details: error.message,
          code: error.code,
          stack: error.stack
        });
      }
    }
    
    // Unsupported method
    console.log(`[shop-users-api] Method not supported: ${req.method}`);
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('[shop-users-api] Unhandled error in shop users API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}