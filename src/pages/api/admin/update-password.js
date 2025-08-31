import prisma from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Security: only run this on production internal URLs - we restrict by token key
  const token = req.query.token;
  if (token !== 'update-password-token-1234') {
    console.log('Invalid token for update-password endpoint');
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }

  try {
    console.log('Starting admin password update operation...');
    
    // Find admin user by username
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Hash the new password
    const newPassword = 'adminisztrator';
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the admin user with new password
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin password updated successfully!');
    
    return res.status(200).json({ 
      message: 'Admin password updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        credentials: {
          username: 'admin',
          password: newPassword
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating admin password:', error);
    return res.status(500).json({ message: 'Error updating admin password', error: error.message });
  }
} 