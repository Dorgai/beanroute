const { PrismaClient } = require('@prisma/client');

// Use the Railway public connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:VHjNXYBUlYdBagSGERFfKXnMJHRVvGTF@postgres-production-948f.up.railway.app:5432/railway"
    }
  }
});

async function checkConnection() {
  try {
    console.log('Attempting to connect to Railway database...');
    
    // Test the connection
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true
      }
    });

    console.log('\nConnected successfully! Found users:');
    console.log('==================================');
    users.forEach(user => {
      console.log(`\nUser: ${user.email || user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
    });

  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection(); 