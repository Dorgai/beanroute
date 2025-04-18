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
    
    // User ID from logs that needs to be created
    const ADMIN_ID = '30a0234d-e4f6-44b1-bb31-587185a1d4ba';
    const ADMIN_EMAIL = 'admin@beanroute.com';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: ADMIN_ID }
    });
    
    if (existingUser) {
      console.log(`Admin user with ID ${ADMIN_ID} already exists, updating...`);
      
      // Hash the password
      const hashedPassword = await hashPassword('admin123');
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: ADMIN_ID },
        data: {
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
      
      return res.status(200).json({ 
        message: 'Admin user updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          credentials: {
            username: 'admin',
            password: 'admin123'
          }
        }
      });
    }
    
    // Create user with specific ID
    console.log(`Creating admin user with ID ${ADMIN_ID}...`);
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        id: ADMIN_ID,
        username: 'admin',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log(`Admin user created: ${newUser.id}`);
    
    // Find a shop to connect the user to
    const shop = await prisma.shop.findFirst();
    
    if (shop) {
      // Connect user to shop
      await prisma.userShop.create({
        data: {
          userId: ADMIN_ID,
          shopId: shop.id,
          role: 'ADMIN'
        }
      });
      
      console.log(`Connected admin user to shop: ${shop.id}`);
    }
    
    return res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        credentials: {
          username: 'admin',
          password: 'admin123'
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