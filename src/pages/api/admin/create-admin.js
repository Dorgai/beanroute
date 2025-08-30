import prisma from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  // Ensure this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Require a special key for security
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.ADMIN_SETUP_KEY || 'special-admin-setup-key';
  
  if (apiKey !== expectedApiKey) {
    console.log('Invalid API key provided for admin creation');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('Starting admin user creation process...');
    
    // Check if user already exists by ID
    const existingUser = await prisma.user.findUnique({
      where: { id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba' }
    });
    
    if (existingUser) {
      console.log('User with ID 30a0234d-e4f6-44b1-bb31-587185a1d4ba already exists');
      return res.status(200).json({ 
        message: 'Admin user already exists', 
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email
        }
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword('admin123');
    
    // Create the admin user with the specific ID
    const admin = await prisma.user.create({
      data: {
        id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba',
        username: 'admin',
        email: 'admin@beanroute.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin user created with ID:', admin.id);
    
    // Get default shop
    const shop = await prisma.shop.findFirst();
    
    if (shop) {
      // Connect admin to shop
      await prisma.userShop.create({
        data: {
          userId: admin.id,
          shopId: shop.id,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin user connected to shop:', shop.name);
    }
    
    return res.status(201).json({ 
      message: 'Admin user created successfully', 
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      },
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
} 