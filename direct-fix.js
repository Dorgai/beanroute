const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFailedMigration() {
  console.log('Starting database migration fix process...');
  
  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('Successfully connected to the database');
    
    // Check if _prisma_migrations table exists
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '_prisma_migrations'
        );
      `;
      
      const tableExists = result[0].exists;
      if (!tableExists) {
        console.log('_prisma_migrations table does not exist. No migrations to fix.');
        return true;
      }
      
      console.log('_prisma_migrations table exists. Checking for failed migrations...');
      
      // Look for the specific failed migration or any failed migration
      const failedMigrations = await prisma.$queryRaw`
        SELECT * FROM _prisma_migrations 
        WHERE applied_steps_count < migration_steps_count 
        OR success = false;
      `;
      
      if (failedMigrations.length === 0) {
        console.log('No failed migrations found. Everything is in good state.');
        return true;
      }
      
      console.log(`Found ${failedMigrations.length} failed migrations. Attempting to fix...`);
      
      // Print details of failed migrations
      failedMigrations.forEach(migration => {
        console.log(`- Migration ID: ${migration.id}, Name: ${migration.migration_name}, Success: ${migration.success}, Applied Steps: ${migration.applied_steps_count}/${migration.migration_steps_count}`);
      });
      
      // Delete the failed migrations to allow them to be reapplied
      for (const migration of failedMigrations) {
        console.log(`Removing failed migration: ${migration.migration_name}`);
        await prisma.$executeRaw`
          DELETE FROM _prisma_migrations 
          WHERE id = ${migration.id};
        `;
      }
      
      console.log('Successfully reset failed migrations. Migrations can now be reapplied.');
      return true;
    } catch (error) {
      console.error('Error while checking for _prisma_migrations table:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Self-executing async function
(async () => {
  try {
    const success = await fixFailedMigration();
    
    if (success) {
      console.log('Migration fix process completed successfully');
      process.exit(0); // Exit with success code
    } else {
      console.error('Migration fix process failed');
      process.exit(1); // Exit with error code
    }
  } catch (error) {
    console.error('Unhandled error in migration fix process:', error);
    process.exit(1); // Exit with error code
  }
})(); 