// Script to update admin password in production
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function updateProductionPassword() {
  console.log('Starting admin password update in production...');
  
  // Use direct database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  });
  
  try {
    // Find admin user by username
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.error('Admin user not found!');
      return;
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // New password to set
    const newPassword = 'adminisztrator';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user with new password
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });
    
    console.log('Admin password updated successfully in production!');
    console.log('New credentials:');
    console.log('Username: admin');
    console.log('Password: adminisztrator');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
    console.error('Error details:', error.message);
    // Log the database URL (with credentials removed)
    const dbUrl = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '').replace(/:\/\/[^@]+@/, '://****:****@');
    console.log('Database URL being used:', dbUrl);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateProductionPassword(); 