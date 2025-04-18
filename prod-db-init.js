const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function initProductionDatabase() {
  console.log('=== PRODUCTION DATABASE INITIALIZATION ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');
  
  try {
    // Generate Prisma client
    console.log('\n1. Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Force reset database schema using db push 
    console.log('\n2. Applying schema using db push...');
    execSync('npx prisma db push --force-reset --accept-data-loss', { stdio: 'inherit' });
    
    // Seed the database with essential data
    console.log('\n3. Seeding database with essential data...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      
      // Create admin user
      const adminExists = await prisma.user.findFirst({
        where: { username: 'admin' }
      });
      
      let adminUser;
      if (!adminExists) {
        adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@beanroute.com',
            password: '$2b$10$BW4A9gUXyZR99ksXEYT.xOvwKqN1s5dFPrM2X1mth/27NJ4S4CXaW', // hashed password: admin
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            status: 'ACTIVE'
          }
        });
        console.log('✓ Created admin user');
      } else {
        adminUser = adminExists;
        console.log('✓ Admin user already exists');
      }
      
      // Create a default shop if none exists
      const shopExists = await prisma.shop.findFirst();
      
      if (!shopExists) {
        const shop = await prisma.shop.create({
          data: {
            name: 'Bean Heaven',
            address: '123 Coffee Lane',
            city: 'Coffee City',
            state: 'Roast State',
            zipCode: '12345',
            country: 'Beanland',
            phoneNumber: '555-123-4567',
            email: 'shop@beanroute.com',
            minCoffeeQuantityLarge: 10,
            minCoffeeQuantitySmall: 5,
            createdById: adminUser.id
          }
        });
        
        // Add admin to the shop
        await prisma.userShop.create({
          data: {
            userId: adminUser.id,
            shopId: shop.id,
            role: 'OWNER'
          }
        });
        
        console.log('✓ Created default shop and assigned admin');
      } else {
        console.log('✓ Default shop already exists');
      }
      
      // Create default coffee items
      const coffeeExists = await prisma.greenCoffee.findFirst();
      
      if (!coffeeExists) {
        await prisma.greenCoffee.createMany({
          data: [
            {
              name: 'Ethiopian Yirgacheffe',
              quantity: 100,
              grade: 'SPECIALTY',
              country: 'Ethiopia',
              producer: 'Yirgacheffe Co-op',
              notes: 'Floral, fruity with bright acidity',
              createdById: adminUser.id
            },
            {
              name: 'Colombian Supremo',
              quantity: 75,
              grade: 'PREMIUM',
              country: 'Colombia',
              producer: 'Supremo Association',
              notes: 'Chocolate, caramel notes with balanced body',
              createdById: adminUser.id
            },
            {
              name: 'Jamaican Blue Mountain',
              quantity: 25,
              grade: 'RARITY',
              country: 'Jamaica',
              producer: 'Blue Mountain Estate',
              notes: 'Smooth, clean with mild flavor and no bitterness',
              createdById: adminUser.id
            }
          ]
        });
        
        console.log('✓ Created sample coffee inventory');
      } else {
        console.log('✓ Coffee inventory already exists');
      }
      
      console.log('\nDatabase initialization completed successfully.');
      
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initProductionDatabase(); 