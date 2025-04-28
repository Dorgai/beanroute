import prisma from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Security: only run this on production internal URLs - we restrict by token key
  const token = req.query.token;
  if (token !== 'fix-admin-token-1234') {
    console.log('Invalid token for fix-admin endpoint');
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }

  try {
    console.log('Starting admin user fix operation...');
    
    // Find admin user by username
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Hash the password
    const hashedPassword = await hashPassword('adminisztrator');
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin password updated successfully!');
    
    return res.status(200).json({ 
      message: 'Admin user updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        credentials: {
          username: 'admin',
          password: 'adminisztrator'
        }
      }
    });
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
    return res.status(500).json({ 
      message: 'Error fixing admin user', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 