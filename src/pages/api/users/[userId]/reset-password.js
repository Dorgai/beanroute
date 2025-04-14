import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { resetUserPassword, getUserById, canManageUsers } from '../../../../lib/user-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Authorization: Only Admins/Owners can reset passwords
    if (!canManageUsers(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId } = req.query;
    const { newPassword } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Basic password validation (improve as needed)
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // Check if target user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    await resetUserPassword(userId, newPassword);

    // Don't return the password!
    return res.status(200).json({ message: `Password for user ${targetUser.username} has been reset.` });

  } catch (error) {
    console.error(`Error resetting password for user ${req.query.userId}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 