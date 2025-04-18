const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser(username, role) {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return prisma.user.upsert({
    where: { username },
    update: { role },
    create: {
      username,
      email: `${username}@beanroute.com`,
      password: hashedPassword,
      firstName: username.charAt(0).toUpperCase() + username.slice(1),
      lastName: 'User',
      role,
      status: 'ACTIVE'
    }
  });
}

async function main() {
  try {
    console.log('Creating test users...');
    
    const barista = await createTestUser('barista', 'BARISTA');
    console.log(`Created barista user: ${barista.username}`);
    
    const roaster = await createTestUser('roaster', 'ROASTER');
    console.log(`Created roaster user: ${roaster.username}`);
    
    const retailer2 = await createTestUser('retailer2', 'RETAILER');
    console.log(`Created second retailer user: ${retailer2.username}`);
    
    console.log('All test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 