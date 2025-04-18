const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to .env file for local development
const envPath = path.join(__dirname, '..', '.env');

function setupEnv() {
  // Check if we're running in Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(`Running in Railway environment: ${process.env.RAILWAY_ENVIRONMENT}`);
    return;
  }
  
  // For local development, load environment variables from .env
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env file');
    require('dotenv').config({ path: envPath });
  } else {
    console.warn('No .env file found. Make sure environment variables are set.');
  }
}

function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  console.log(`Database URL is configured: ${process.env.DATABASE_URL.substring(0, 20)}...`);
}

function resetDatabase() {
  try {
    console.log('=== Starting database reset process ===');
    
    setupEnv();
    ensureDatabaseUrl();
    
    // Push schema directly (bypassing migrations)
    console.log('Pushing schema directly to database...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('=== Database schema pushed successfully ===');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('=== Database reset completed successfully ===');
  } catch (error) {
    console.error('Database reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase(); 