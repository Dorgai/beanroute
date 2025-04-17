#!/usr/bin/env node

// Direct script to initialize and test database connectivity

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

// Display environment info
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//******:******@') : 
  'Not defined');
console.log('NODE_ENV:', process.env.NODE_ENV);

const prisma = new PrismaClient();

async function ensureAdminExists() {
  console.log('Ensuring admin user exists...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists, ensuring password is set correctly...');
      
      // Update the admin password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.update({
        where: { username: 'admin' },
        data: {
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
      
      console.log('Admin user updated successfully.');
      return existingAdmin;
    }
    
    // Create admin user if it doesn't exist
    console.log('Admin user does not exist, creating...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@beanroute.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin user created successfully.');
    
    // Create a sample shop if none exists
    const shopCount = await prisma.shop.count();
    
    if (shopCount === 0) {
      console.log('No shops found, creating a sample shop...');
      
      const shop = await prisma.shop.create({
        data: {
          name: 'Sample Coffee Shop',
          address: '123 Coffee Street, Beanville, BN 12345',
          createdById: admin.id
        }
      });
      
      console.log(`Created sample shop: ${shop.name}`);
    }
    
    return admin;
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    throw error;
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  ensureAdminExists()
    .then(() => {
      console.log('Admin user verification completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in admin user creation:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else {
  // Export for use in other files
  module.exports = { ensureAdminExists };
} 