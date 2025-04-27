// Script to fix Railway database connection issues
require('dotenv').config();
const fs = require('fs');

console.log('Fixing Railway database connection...');

// Check if we're on Railway
if (process.env.RAILWAY === 'true' || process.env.RAILWAY_ENVIRONMENT === 'production') {
  console.log('Running in Railway environment');
  
  // Check if we have a DATABASE_PUBLIC_URL from Railway
  if (process.env.DATABASE_PUBLIC_URL) {
    const publicUrl = process.env.DATABASE_PUBLIC_URL;
    console.log('Found DATABASE_PUBLIC_URL');
    
    // Set DATABASE_URL to the public URL if not already set
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('internal')) {
      console.log('Setting DATABASE_URL to the public URL');
      process.env.DATABASE_URL = publicUrl;
      
      // Also update .env file if it exists
      try {
        if (fs.existsSync('.env')) {
          console.log('Updating .env file');
          let envContent = fs.readFileSync('.env', 'utf8');
          
          // Replace DATABASE_URL line or add it if it doesn't exist
          if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${publicUrl}"`);
          } else {
            envContent += `\nDATABASE_URL="${publicUrl}"\n`;
          }
          
          fs.writeFileSync('.env', envContent);
          console.log('Updated .env file with correct DATABASE_URL');
        }
      } catch (error) {
        console.error('Error updating .env file:', error);
      }
    }
  } else {
    console.warn('No DATABASE_PUBLIC_URL found in environment variables');
  }
} else {
  console.log('Not running in Railway environment, skipping fixes');
}

console.log('Database connection fix completed'); 