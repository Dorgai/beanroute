import prisma from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Security: only run this on production with a secure token
  const token = req.query.token;
  if (token !== process.env.ADMIN_MANAGEMENT_TOKEN) {
    console.log('Invalid token for admin management endpoint');
    return res.status(401).json({ message: 'Unauthorized - invalid token' });
  }

  try {
    console.log('Starting admin management operation...');
    
    // Find admin user by username
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Get the requested operation
    const { operation, data } = req.body;
    
    let updatedUser;
    
    switch (operation) {
      case 'updatePassword':
        if (!data.newPassword) {
          return res.status(400).json({ message: 'New password is required' });
        }
        const hashedPassword = await hashPassword(data.newPassword);
        updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            password: hashedPassword,
            status: 'ACTIVE'
          }
        });
        break;
        
      case 'updateEmail':
        if (!data.newEmail) {
          return res.status(400).json({ message: 'New email is required' });
        }
        updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            email: data.newEmail,
            status: 'ACTIVE'
          }
        });
        break;
        
      case 'updateStatus':
        if (!data.newStatus) {
          return res.status(400).json({ message: 'New status is required' });
        }
        updatedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { 
            status: data.newStatus
          }
        });
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }
    
    console.log(`Admin ${operation} completed successfully!`);
    
    return res.status(200).json({ 
      message: `Admin ${operation} completed successfully`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
    
  } catch (error) {
    console.error('Error in admin management:', error);
    return res.status(500).json({ message: 'Error in admin management', error: error.message });
  }
} 