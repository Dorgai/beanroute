import { logActivity } from './activity-service';
import jwt from 'jsonwebtoken';

// Update the login function to log activity
export async function loginUser(email, password) {
  // ... existing login code ...
  
  if (userMatch) {
    // This is just after successful authentication
    
    // Log login activity
    await logActivity({
      userId: userMatch.id,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: userMatch.id,
      details: 'User logged into the system'
    });
    
    // ... rest of the existing login code ...
  }
  
  // ... rest of the function ...
}

// Update the logout function to log activity
export async function logoutUser(req, res) {
  const token = req.cookies.auth_token;
  let userId = null;
  
  // Try to get the user ID from the token before logout
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      console.error('Error decoding token during logout:', error);
    }
  }
  
  // Perform logout
  res.setHeader('Set-Cookie', 'auth_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
  
  // Log the logout activity if we have a user ID
  if (userId) {
    try {
      await logActivity({
        userId,
        action: 'LOGOUT',
        resource: 'USER',
        resourceId: userId,
        details: 'User logged out of the system'
      });
    } catch (error) {
      console.error('Failed to log logout activity:', error);
    }
  }
  
  return res.status(200).json({ message: 'Logged out successfully' });
}

// Update the reset password function to log activity
export async function resetUserPassword(userId, newPassword, requestingUserId) {
  // ... existing reset password code ...
  
  // Log password reset activity
  await logActivity({
    userId: requestingUserId,
    action: 'RESET_PASSWORD',
    resource: 'USER',
    resourceId: userId,
    details: `Password reset for user (ID: ${userId})`
  });
  
  // ... rest of the function ...
}

// ... rest of the file ... 