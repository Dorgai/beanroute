const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the specific shop
    const shopId = '37b22ac2-3c39-4419-9233-ba49267ac178';
    console.log(`Checking shop with ID: ${shopId}`);
    
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    
    if (!shop) {
      console.log('Shop not found in database');
      return;
    }
    
    console.log('Shop found:', shop.name);
    
    // Get all users
    console.log('\nFetching all users...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });
    
    console.log(`Found ${allUsers.length} users in the database`);
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.id}) - Role: ${user.role}`);
    });
    
    // Get users already assigned to this shop
    console.log('\nFetching users assigned to this shop...');
    const shopUsers = await prisma.userShop.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    console.log(`Found ${shopUsers.length} users assigned to the shop`);
    shopUsers.forEach(userShop => {
      console.log(`- ${userShop.user.username} (${userShop.userId}) - Shop Role: ${userShop.role}`);
    });
    
    // Find users not assigned to this shop
    const assignedUserIds = shopUsers.map(userShop => userShop.userId);
    const availableUsers = allUsers.filter(user => !assignedUserIds.includes(user.id));
    
    console.log(`\nFound ${availableUsers.length} users available to be assigned to this shop`);
    availableUsers.forEach(user => {
      console.log(`- ${user.username} (${user.id}) - Role: ${user.role}`);
    });
    
    // Check if test users exist
    const testUsers = ['barista', 'roaster', 'retailer2'];
    console.log('\nChecking for test users...');
    
    for (const username of testUsers) {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      if (user) {
        console.log(`✓ Test user '${username}' exists with ID ${user.id}`);
        
        // Check if this user is assigned to the shop
        const userShop = await prisma.userShop.findUnique({
          where: {
            userId_shopId: {
              userId: user.id,
              shopId
            }
          }
        });
        
        if (userShop) {
          console.log(`  - Already assigned to shop with role: ${userShop.role}`);
        } else {
          console.log(`  - Not assigned to this shop yet`);
          
          // Try to assign the user to the shop
          try {
            const result = await prisma.userShop.create({
              data: {
                userId: user.id,
                shopId,
                role: user.role,
              },
            });
            console.log(`  - Successfully assigned to shop with role: ${result.role}`);
          } catch (error) {
            console.error(`  - Error assigning user to shop: ${error.message}`);
          }
        }
      } else {
        console.log(`✗ Test user '${username}' does not exist`);
      }
    }
    
  } catch (error) {
    console.error('Error running diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 