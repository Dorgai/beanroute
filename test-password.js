const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function testPassword() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    
    // Get the admin user from the database
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found in database!');
      return;
    }
    
    // Get the hashed password from the database
    const hashedPassword = adminUser.password;
    console.log('Admin user found with ID:', adminUser.id);
    console.log('Current password hash:', hashedPassword.substring(0, 30) + '...');
    
    // Test both the old and new passwords
    const plainPassword = 'admin123';
    console.log(`Testing password match for: "${plainPassword}"`);
    
    // Compare the password directly with bcrypt
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      // If the password doesn't match, generate a new hash and update
      console.log('Password does not match. Creating a new hash...');
      const newHash = await bcrypt.hash(plainPassword, 10);
      console.log('New password hash:', newHash.substring(0, 30) + '...');
      
      // Update the password in the database
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          password: newHash,
          updatedAt: new Date()
        }
      });
      
      console.log('Admin password has been updated with the new hash.');
      
      // Test the updated password
      const updatedUser = await prisma.user.findUnique({
        where: { id: adminUser.id }
      });
      
      const newHashedPassword = updatedUser.password;
      const isNewMatch = await bcrypt.compare(plainPassword, newHashedPassword);
      
      console.log('Updated password match result:', isNewMatch);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword()
  .then(() => console.log('Test completed.'))
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 