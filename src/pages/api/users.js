import { verifyRequestAndGetUser } from '../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log(`[/api/users] Handling ${req.method} request`);
  
  try {
    // Authenticate the user
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      console.log('[/api/users] Authentication failed');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    console.log(`[/api/users] Authenticated user: ${user.username} (${user.role})`);
    
    if (req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;
      
      console.log(`[/api/users] Fetching users with pagination - page: ${page}, limit: ${limit}`);
      
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          username: 'asc',
        },
      });
      
      console.log(`[/api/users] Found ${users.length} users`);
      
      // Count total users for pagination
      const totalUsers = await prisma.user.count();
      
      return res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
        },
      });
    } else if (req.method === 'POST') {
      // Check authorization for user creation (only admin or owner)
      if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
        console.log(`[/api/users] Unauthorized role for user creation: ${user.role}`);
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions to create users' });
      }
      
      const { username, email, password, firstName, lastName, role, status } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !role) {
        console.log('[/api/users] Missing required fields for user creation');
        return res.status(400).json({ message: 'Required fields missing' });
      }
      
      try {
        // Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username },
              { email },
            ],
          },
        });
        
        if (existingUser) {
          console.log(`[/api/users] User creation failed - Username or email already exists: ${username}, ${email}`);
          return res.status(409).json({ message: 'Username or email already exists' });
        }
        
        // Create the user
        const newUser = await prisma.user.create({
          data: {
            username,
            email,
            password, // This should be hashed in a middleware or hook
            firstName,
            lastName,
            role,
            status: status || 'ACTIVE',
            createdById: user.id,
          },
        });
        
        console.log(`[/api/users] User created successfully: ${newUser.username}`);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        
        return res.status(201).json({
          message: 'User created successfully',
          user: userWithoutPassword,
        });
      } catch (error) {
        console.error('[/api/users] Error creating user:', error);
        return res.status(500).json({ message: 'Failed to create user', details: error.message });
      }
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[/api/users] Error handling request:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  } finally {
    await prisma.$disconnect();
  }
} 