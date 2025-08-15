const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking admin user details...');
    
    const adminUser = await prisma.user.findFirst({
      where: {
        username: 'admin'
      },
      select: {
        id: true,
        username: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }

    console.log('Admin user details:');
    console.log(JSON.stringify(adminUser, null, 2));
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 