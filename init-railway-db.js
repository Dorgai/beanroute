const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Step 1: Generate Prisma client
    console.log('\n1. Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✓ Prisma client generated successfully');
    
    // Step 2: Push schema to database (use this instead of migrations for initial setup)
    console.log('\n2. Pushing Prisma schema to database...');
    try {
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
      console.log('✓ Database schema pushed successfully');
    } catch (error) {
      console.error('Error pushing schema:', error.message);
      console.log('Continuing with the process...');
    }
    
    // Step 3: Seed the database with essential data
    console.log('\n3. Seeding database with essential data...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      
      // Check if admin user exists, create if not
      const adminExists = await prisma.user.findFirst({
        where: {
          username: 'admin'
        }
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
      
      console.log('✓ Database seeding completed');
      
    } catch (error) {
      console.error('Error seeding database:', error);
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('\nDatabase initialization completed successfully.');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase(); 