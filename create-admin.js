const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('Creating admin user...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check connection to the database
    console.log('Checking database connection...');
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Database connection successful!');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the existing admin user's password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const updatedUser = await prisma.user.update({
        where: {
          username: 'admin'
        },
        data: {
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      
      console.log(`Admin user updated: ${updatedUser.username} (ID: ${updatedUser.id})`);
    } else {
      console.log('Admin user does not exist. Creating new admin user...');
      
      // Create a new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@beanroute.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      
      console.log(`New admin user created: ${newUser.username} (ID: ${newUser.id})`);
    }
    
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    console.log('Admin user details:');
    console.log({
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status,
      passwordHash: adminUser.password.substring(0, 10) + '...' // Show just part of the hash for security
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => console.log('Process completed.'))
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 