import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { logActivity } from '../../../../lib/activity-service';
import { getUserById, deleteUser, updateUser, canManageUsers } from '../../../../lib/user-service';

export default async function handler(req, res) {
  // Authenticate request
  const user = await verifyRequestAndGetUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = req.query;

  // Handle GET requests
  if (req.method === 'GET') {
    try {
      // Users can always view their own profile, admins/owners can view any profile
      const isOwnProfile = userId === user.id;
      const hasViewPermission = isOwnProfile || canManageUsers(user.role);
      
      if (!hasViewPermission) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      
      const targetUser = await getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove sensitive data before returning
      delete targetUser.password;
      
      return res.status(200).json(targetUser);
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle PUT requests
  else if (req.method === 'PUT') {
    try {
      // Check if user has permission to update users
      const isOwnProfile = userId === user.id;
      const hasUpdatePermission = isOwnProfile || canManageUsers(user.role);
      
      if (!hasUpdatePermission) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      
      // Get the existing user to check if they exist
      const existingUser = await getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Extract updatable fields from request
      const { username, email, firstName, lastName, role, status } = req.body;
      
      // Regular users can only update their own profile and can't change role or status
      if (isOwnProfile && !canManageUsers(user.role)) {
        // Only allow updating personal info for regular users
        const updatedUser = await updateUser(userId, {
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          // Optionally allow username/email update with verification
        });
        
        // Remove sensitive data
        delete updatedUser.password;
        
        await logActivity({
          userId: user.id,
          action: 'UPDATE',
          resource: 'USER',
          resourceId: userId,
          details: 'Updated own profile'
        });
        
        return res.status(200).json(updatedUser);
      }
      
      // Admins and owners can update all fields
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (role && canManageUsers(user.role)) updateData.role = role;
      if (status && canManageUsers(user.role)) updateData.status = status;
      
      const updatedUser = await updateUser(userId, updateData);
      
      // Log the activity
      await logActivity({
        userId: user.id,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: userId,
        details: `Updated user ${updatedUser.username}`
      });
      
      // Remove sensitive data
      delete updatedUser.password;
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      
      // Handle unique constraint errors
      if (error.code === 'P2002') {
        return res.status(409).json({ 
          message: 'Username or email already exists',
          field: error.meta?.target?.[0] || 'unknown'
        });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle DELETE request - Remove a user
  else if (req.method === 'DELETE') {
    try {
      // Only admins/owners can delete users
      if (!canManageUsers(user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      
      // Don't allow deleting self
      if (userId === user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const targetUser = await getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      await deleteUser(userId);

      // Log the activity
      await logActivity({
        userId: user.id,
        action: 'DELETE',
        resource: 'USER',
        resourceId: userId,
        details: `Deleted user ${targetUser.username || targetUser.email}`
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 
  
  // Method not allowed
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 