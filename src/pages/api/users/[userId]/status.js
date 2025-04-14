import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { updateUserStatus, getUserById, canManageUsers } from '../../../../lib/user-service';
import { UserStatus } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Authorization: Only Admins/Owners can change status
    if (!canManageUsers(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId } = req.query;
    const { status } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate status
    if (!status || !Object.values(UserStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Prevent users from changing their own status via this route (optional safeguard)
    if (user.id === userId) {
      return res.status(403).json({ message: 'Cannot change your own status via this endpoint' });
    }

    // Check if target user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const updatedUser = await updateUserStatus(userId, status);

    return res.status(200).json({ message: 'User status updated', user: updatedUser });

  } catch (error) {
    console.error(`Error updating status for user ${req.query.userId}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 