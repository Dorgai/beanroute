// Railway Database Configuration
require('dotenv').config();
const fs = require('fs');

console.log('Configuring Railway database connection...');

// Get environment variables
const databaseUrl = process.env.DATABASE_URL;
const databasePublicUrl = process.env.DATABASE_PUBLIC_URL;
const isRailway = process.env.RAILWAY || process.env.RAILWAY_ENVIRONMENT;

// Main configuration function
function configureDatabase() {
  // Check if running on Railway
  if (isRailway) {
    console.log('Running on Railway environment');
    
    // If DATABASE_PUBLIC_URL is available, use it
    if (databasePublicUrl) {
      console.log('Found DATABASE_PUBLIC_URL, using for external connections');
      process.env.DATABASE_URL = databasePublicUrl;
      
      try {
        // Update .env file if it exists
        if (fs.existsSync('.env')) {
          console.log('Updating .env file with DATABASE_PUBLIC_URL');
          let envContent = fs.readFileSync('.env', 'utf8');
          
          if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${databasePublicUrl}"`);
          } else {
            envContent += `\nDATABASE_URL="${databasePublicUrl}"\n`;
          }
          
          fs.writeFileSync('.env', envContent);
        }
      } catch (error) {
        console.error('Error updating .env file:', error);
      }
      
      return {
        success: true,
        message: 'Using DATABASE_PUBLIC_URL for database connection'
      };
    } else {
      console.log('No DATABASE_PUBLIC_URL found, keeping existing configuration');
      return {
        success: false,
        message: 'No DATABASE_PUBLIC_URL available'
      };
    }
  } else {
    console.log('Not running on Railway, skipping configuration');
    return {
      success: false,
      message: 'Not running on Railway environment'
    };
  }
}

// Export functions
module.exports = {
  configureDatabase
}; 