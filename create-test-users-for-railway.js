const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser(userData) {
  console.log(`Creating/updating test user: ${userData.username}`);
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });
    
    if (existingUser) {
      console.log(`User ${userData.username} already exists, updating...`);
      // Update the existing user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      console.log(`Updated user ${updatedUser.username} with role ${updatedUser.role}`);
      return updatedUser;
    } else {
      console.log(`Creating new user ${userData.username}...`);
      // Create a new user
      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      console.log(`Created user ${newUser.username} with role ${newUser.role}`);
      return newUser;
    }
  } catch (error) {
    console.error(`Error creating/updating user ${userData.username}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Create a barista user
    await createTestUser({
      username: 'barista',
      email: 'barista@example.com',
      password: 'password123',
      firstName: 'Barry',
      lastName: 'Barista',
      role: 'BARISTA',
      status: 'ACTIVE',
    });
    
    // Create a roaster user
    await createTestUser({
      username: 'roaster',
      email: 'roaster@example.com',
      password: 'password123',
      firstName: 'Ross',
      lastName: 'Roaster',
      role: 'ROASTER',
      status: 'ACTIVE',
    });
    
    // Create a retailer user
    await createTestUser({
      username: 'retailer2',
      email: 'retailer2@example.com',
      password: 'password123',
      firstName: 'Rita',
      lastName: 'Retailer',
      role: 'RETAILER',
      status: 'ACTIVE',
    });
    
    console.log('All test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 