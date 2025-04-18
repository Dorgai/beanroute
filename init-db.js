#!/usr/bin/env node

// Direct script to initialize and test database connectivity

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function fixFailedMigration() {
  console.log('Checking for failed migrations...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if _prisma_migrations table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('_prisma_migrations table does not exist. No migrations to check.');
      return false;
    }
    
    // Find any failed migrations
    const failedMigrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE finished_at IS NULL;
    `;
    
    if (failedMigrations.length === 0) {
      console.log('No failed migrations found.');
      return false;
    }
    
    // If we found failed migrations, reset them
    console.log(`Found ${failedMigrations.length} failed migrations. Resetting them...`);
    
    for (const migration of failedMigrations) {
      console.log(`Resetting migration: ${migration.migration_name}`);
      await prisma.$queryRaw`
        DELETE FROM _prisma_migrations 
        WHERE id = ${migration.id};
      `;
    }
    
    console.log('Failed migrations reset successfully.');
    return true;
  } catch (error) {
    console.error('Error checking/fixing migrations:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:\/\/([^:]+):[^@]+@/, '://******:******@') : 'not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    
    console.log('Starting database initialization...');
    
    // Check database connection
    console.log('Checking database connection...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // Check if tables exist
    const tablesExist = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `;
    
    await prisma.$disconnect();
    
    if (!tablesExist[0].exists) {
      console.log('Database tables do not exist yet. Will create them.');
      
      // Generate Prisma client
      console.log('Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Check and fix any failed migrations before applying new migrations
      await fixFailedMigration();
      
      // Apply migrations
      console.log('Applying Prisma migrations...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (migrationError) {
        console.error('Error during migration deployment. Will try to continue initialization...');
      }
      
      // Check if tables were successfully created
      const prismaAfterMigration = new PrismaClient();
      const tablesCreated = await prismaAfterMigration.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `;
      
      if (!tablesCreated[0].exists) {
        console.log('Tables not created by migration. Running schema push as fallback...');
        try {
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('Schema push completed.');
        } catch (pushError) {
          console.error('Error during schema push:', pushError);
          throw new Error('Failed to initialize database schema');
        }
      }
      
      await prismaAfterMigration.$disconnect();
      
      // Seed the database with initial data
      console.log('Seeding database with initial data...');
      try {
        execSync('node init-railway-db.js', { stdio: 'inherit' });
      } catch (seedError) {
        console.error('Error during database seeding:', seedError);
      }
    } else {
      console.log('Database tables already exist. Skipping schema creation.');
      
      // Still check and fix any failed migrations
      const migrationsFixed = await fixFailedMigration();
      
      if (migrationsFixed) {
        // If we fixed migrations, run migrate deploy to ensure schema is up to date
        console.log('Running migration deploy after fixing failed migrations...');
        try {
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        } catch (migrationError) {
          console.error('Error deploying migrations after fix:', migrationError);
        }
      }
    }
    
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main(); 