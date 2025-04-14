import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { resetUserPassword, getUserById, canManageUsers } from '../../../../lib/user-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log the request details for debugging
    console.log(`[reset-password] Processing reset password request for userId: ${req.query.userId}`);
    
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      console.log('[reset-password] Unauthorized: No authenticated user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Authorization: Only Admins/Owners can reset passwords
    if (!canManageUsers(user.role)) {
      console.log(`[reset-password] Forbidden: User ${user.id} with role ${user.role} attempted to reset password`);
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId } = req.query;
    const { newPassword } = req.body;

    console.log(`[reset-password] Validating input for userId: ${userId}`);
    
    if (!userId || typeof userId !== 'string') {
      console.log('[reset-password] Invalid userId provided');
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Basic password validation (improve as needed)
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      console.log('[reset-password] Invalid password: Must be at least 8 characters');
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // Check if target user exists
    console.log(`[reset-password] Looking up target user: ${userId}`);
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      console.log(`[reset-password] Target user not found: ${userId}`);
      return res.status(404).json({ message: 'Target user not found' });
    }

    console.log(`[reset-password] Resetting password for user: ${targetUser.username} (${userId})`);
    await resetUserPassword(userId, newPassword);

    console.log(`[reset-password] Password reset successful for user: ${targetUser.username}`);
    // Don't return the password!
    return res.status(200).json({ message: `Password for user ${targetUser.username} has been reset.` });

  } catch (error) {
    console.error(`[reset-password] Error resetting password for user ${req.query.userId}:`, error);
    console.error(`[reset-password] Error stack:`, error.stack);
    
    // Check if the error is related to missing modules
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`[reset-password] Missing module: ${error.message}`);
      return res.status(500).json({ message: 'Server configuration error: Missing module' });
    }
    
    // Check if it's a database error
    if (error.name === 'PrismaClientKnownRequestError') {
      console.error(`[reset-password] Database error: ${error.message}`);
      return res.status(500).json({ message: 'Database error occurred' });
    }
    
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
} 