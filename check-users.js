const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        shops: {
          include: {
            shop: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    console.log('\nAll Users in System:');
    console.log('===================');
    
    users.forEach(user => {
      console.log(`\nUser: ${user.email || user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      if (user.shops.length > 0) {
        console.log('Assigned Shops:');
        user.shops.forEach(userShop => {
          console.log(`- ${userShop.shop.name} (${userShop.role})`);
        });
      } else {
        console.log('No shops assigned');
      }
      console.log('-------------------');
    });

  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 