// This script helps initialize the database schema and seed data
// Can be run directly from the command line or called from the server

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runCommand(command, retries = 3, delay = 5000) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`Running: ${command} (attempt ${attempt + 1}/${retries + 1})`);
      const { stdout, stderr } = await execAsync(command);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      return true;
    } catch (error) {
      console.error(`Command failed: ${command}`);
      console.error(error.message);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        console.error(`All ${retries + 1} attempts failed for command: ${command}`);
        return false;
      }
    }
  }
  return false;
}

async function initializeDatabase() {
  console.log('🔄 Starting database initialization...');

  // Generate Prisma client
  const generateResult = await runCommand('npx prisma generate');
  if (!generateResult) {
    console.warn('⚠️ Prisma client generation failed, but continuing...');
  }

  // Run database migrations
  const migrateResult = await runCommand('npx prisma migrate deploy', 5, 10000);
  if (!migrateResult) {
    console.error('❌ Database migration failed after multiple attempts!');
    console.log('⚠️ The application will start anyway and retry connecting to the database.');
    return false;
  }

  // Seed the database if SEED_DATABASE env variable is set to true
  if (process.env.SEED_DATABASE === 'true') {
    console.log('Seeding database because SEED_DATABASE=true');
    const seedResult = await runCommand('npx prisma db seed', 2, 5000);
    if (!seedResult) {
      console.warn('⚠️ Database seeding failed! This may be expected if data already exists.');
    }
  } else {
    console.log('Skipping database seeding (SEED_DATABASE is not set to true)');
  }

  console.log('✅ Database initialization completed!');
  return true;
}

// If this script is run directly (not imported)
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('Database initialization completed successfully');
        process.exit(0);
      } else {
        console.error('Database initialization failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during database initialization:', error);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = { initializeDatabase };
} 