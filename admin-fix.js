// admin-fix.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating admin user with specific ID...');
  
  try {
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba' }
    });
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba' },
        data: {
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
      
      console.log('Updated user:', updatedUser.id);
      return updatedUser;
    }
    
    // Create a new user with the specific ID
    console.log('Creating new user with ID: 30a0234d-e4f6-44b1-bb31-587185a1d4ba');
    const newUser = await prisma.user.create({
      data: {
        id: '30a0234d-e4f6-44b1-bb31-587185a1d4ba',
        username: 'admin',
        email: 'admin@beanroute.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('Created new user:', newUser.id);
    
    // Get the first shop
    const shop = await prisma.shop.findFirst();
    
    if (shop) {
      // Connect the user to the shop
      const userShop = await prisma.userShop.create({
        data: {
          userId: newUser.id,
          shopId: shop.id,
          role: 'ADMIN'
        }
      });
      
      console.log('Connected user to shop:', shop.id);
    }
    
    return newUser;
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    throw error;
  }
}

// Run the function
createAdminUser()
  .then(user => {
    console.log('Success! Admin user ID:', user.id);
    console.log('Admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 