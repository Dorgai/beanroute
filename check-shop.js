const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shopId = '37b22ac2-3c39-4419-9233-ba49267ac178';
  console.log(`Checking if shop with ID ${shopId} exists...`);
  
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    
    if (shop) {
      console.log('Shop found:');
      console.log(shop);
    } else {
      console.log('Shop not found in database');
      
      // List all shops
      console.log('\nListing all shops:');
      const shops = await prisma.shop.findMany({
        select: {
          id: true,
          name: true,
        }
      });
      
      if (shops.length > 0) {
        shops.forEach(shop => {
          console.log(`- ${shop.name} (${shop.id})`);
        });
      } else {
        console.log('No shops found in database');
      }
    }
  } catch (error) {
    console.error('Error querying the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 