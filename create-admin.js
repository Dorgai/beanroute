const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('Creating admin user with ID: 30a0234d-e4f6-44b1-bb31-587185a1d4ba');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if user already exists by ID
    const existingUser = await prisma.user.findUnique({
      where: { id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba' }
    });
    
    if (existingUser) {
      console.log('User with ID 30a0234d-e4f6-44b1-bb31-587185a1d4ba already exists!');
      return;
    }
    
    const admin = await prisma.user.create({
      data: {
        id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba',  // Use the specific ID from the token
        username: 'admin',
        email: 'admin@beanroute.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin user created with ID:', admin.id);
    console.log('Username: admin');
    console.log('Password: admin123');
    
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
    
    console.log('Admin user creation completed successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 