// Script to reset admin password
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  console.log('Starting admin password reset...');
  
  const prisma = new PrismaClient();
  
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
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user with new password
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });
    
    console.log(`Admin password reset successfully!`);
    console.log(`Username: admin`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
resetAdminPassword(); 