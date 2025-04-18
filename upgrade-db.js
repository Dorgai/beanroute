const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('=== Starting Database Reset Process ===');
  try {
    console.log('Pushing Prisma schema to database...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('Database schema pushed successfully.');
    
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Creating admin user...');
    await createAdminUser();
    
    console.log('=== Database reset completed successfully ===');
    return true;
  } catch (error) {
    console.error('Error during database reset:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdminUser() {
  try {
    // Default credentials
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@beanroute.com';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log(`Admin user created with ID: ${admin.id}`);
    console.log(`Admin credentials: username=${username}, password=${password}`);
    
    // Create default shop
    const shop = await prisma.shop.upsert({
      where: { name: 'Bean Heaven' },
      update: {},
      create: {
        name: 'Bean Heaven',
        address: '123 Coffee Street',
        minCoffeeQuantitySmall: 5,
        minCoffeeQuantityLarge: 10,
        createdById: admin.id
      }
    });
    
    console.log(`Default shop created with ID: ${shop.id}`);
    
    // Connect admin to shop
    await prisma.userShop.upsert({
      where: {
        userId_shopId: {
          userId: admin.id,
          shopId: shop.id
        }
      },
      update: {},
      create: {
        userId: admin.id,
        shopId: shop.id,
        role: 'ADMIN'
      }
    });
    
    console.log('Admin connected to shop successfully');
    
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

// Run the script
resetDatabase()
  .then(success => {
    if (success) {
      console.log('✅ Database reset completed successfully');
      console.log('✅ Admin user created with credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      process.exit(0);
    } else {
      console.error('❌ Database reset failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 