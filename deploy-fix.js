const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function initDatabase() {
  console.log('Starting database initialization...');
  
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Try to create tables by force-pushing the schema
    try {
      console.log('Attempting to create database schema...');
      // This is a direct database query to check if User table exists
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `;
      
      if (!tableExists[0].exists) {
        console.log('User table does not exist. Creating schema from scratch...');
        // We'll create the admin user after schema creation
      } else {
        console.log('User table already exists.');
      }
    } catch (error) {
      console.error('Error checking for User table:', error);
      console.log('Will attempt to create schema anyway.');
    }
    
    // Create admin user
    try {
      console.log('Creating admin user...');
      const adminPassword = 'admin123'; // Default password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
          username: 'admin',
          email: 'admin@beanroute.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      
      console.log(`Admin user created/updated: ${admin.id}`);
      console.log(`Admin credentials: username: admin, password: ${adminPassword}`);
      
      // Create default shop if it doesn't exist
      const defaultShop = await prisma.shop.upsert({
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
      
      console.log(`Default shop created/updated: ${defaultShop.id}`);
      
      // Connect admin to shop through UserShop
      await prisma.userShop.upsert({
        where: {
          userId_shopId: {
            userId: admin.id,
            shopId: defaultShop.id,
          }
        },
        update: {},
        create: {
          userId: admin.id,
          shopId: defaultShop.id,
          role: 'ADMIN'
        }
      });
      
      console.log('Admin connected to shop successfully');
      
      console.log('Database initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Error creating admin or shop:', error);
      return false;
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Self-executing async function
(async () => {
  try {
    console.log('=== Starting Database Initialization Script ===');
    const success = await initDatabase();
    
    if (success) {
      console.log('=== Database setup completed successfully ===');
      console.log('IMPORTANT: Admin user credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      process.exit(0);
    } else {
      console.error('=== Database setup failed ===');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error in database initialization:', error);
    process.exit(1);
  }
})(); 