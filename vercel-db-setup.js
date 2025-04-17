#!/usr/bin/env node
const { exec } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📦 Vercel Database Setup Script\n');

// Ask for the production DATABASE_URL from Vercel
rl.question('Enter your Vercel PostgreSQL connection URL: ', (databaseUrl) => {
  if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
    console.error('❌ Invalid PostgreSQL connection string!');
    rl.close();
    return;
  }

  console.log('\n🔄 Creating temporary .env file for Prisma...');
  
  // Create a temporary .env file with the DATABASE_URL
  fs.writeFileSync('.env.setup', `DATABASE_URL="${databaseUrl}"\n`);
  
  console.log('✅ Temporary .env file created\n');
  console.log('🔄 Running Prisma deployment...\n');
  
  // Run Prisma commands with the custom .env file
  exec('dotenv -e .env.setup -- npx prisma migrate deploy', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running migrations: ${error.message}`);
      console.log(stderr);
      cleanup();
      return;
    }
    
    console.log(stdout);
    console.log('✅ Migrations applied successfully!\n');
    
    // Ask if seed data should be added
    rl.question('Do you want to add seed data? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('\n🔄 Running database seed...\n');
        
        exec('dotenv -e .env.setup -- npx prisma db seed', (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error seeding database: ${error.message}`);
            console.log(stderr);
            cleanup();
            return;
          }
          
          console.log(stdout);
          console.log('✅ Database seeded successfully!\n');
          cleanup();
        });
      } else {
        console.log('\n✅ Skipping seed data\n');
        cleanup();
      }
    });
  });
});

// Cleanup function
function cleanup() {
  console.log('🔄 Cleaning up...');
  fs.unlinkSync('.env.setup');
  console.log('✅ Temporary .env file removed\n');
  console.log('🎉 Database setup complete!\n');
  rl.close();
} 