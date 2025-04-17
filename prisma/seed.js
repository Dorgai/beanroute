const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@beanroute.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  
  console.log(`Created admin user: ${admin.username}`);
  
  // Create sample shop
  const shop = await prisma.shop.upsert({
    where: { name: 'Sample Coffee Shop' },
    update: {},
    create: {
      name: 'Sample Coffee Shop',
      address: '123 Coffee Street, Beanville, BN 12345',
      createdBy: { connect: { id: admin.id } }
    }
  });
  
  console.log(`Created sample shop: ${shop.name}`);
  
  // Create sample coffee
  const coffee = await prisma.greenCoffee.upsert({
    where: { 
      name_country_producer: {
        name: 'Ethiopian Yirgacheffe',
        country: 'Ethiopia',
        producer: 'Yirgacheffe Cooperative'
      }
    },
    update: {},
    create: {
      name: 'Ethiopian Yirgacheffe',
      quantity: 100,
      grade: 'SPECIALTY',
      country: 'Ethiopia',
      producer: 'Yirgacheffe Cooperative',
      notes: 'Floral and citrus notes with a clean finish',
      createdBy: { connect: { id: admin.id } }
    }
  });
  
  console.log(`Created sample coffee: ${coffee.name}`);
  
  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 