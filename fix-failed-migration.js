const { PrismaClient } = require('@prisma/client');

async function fixFailedMigration() {
  console.log('Starting migration fix process...');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // Check if _prisma_migrations table exists
    console.log('Checking if _prisma_migrations table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('_prisma_migrations table does not exist. No migrations to reset.');
      return;
    }
    
    // Find the failed migration
    console.log('Finding failed migration...');
    const failedMigration = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250417000000_add_inventory_alert_system' 
      AND finished_at IS NULL;
    `;
    
    if (failedMigration.length === 0) {
      console.log('No failed migration found with this specific name. Checking for any failed migrations...');
      
      const anyFailedMigration = await prisma.$queryRaw`
        SELECT * FROM _prisma_migrations 
        WHERE finished_at IS NULL;
      `;
      
      if (anyFailedMigration.length === 0) {
        console.log('No failed migrations found at all.');
        return;
      }
      
      console.log(`Found ${anyFailedMigration.length} failed migrations`);
      
      // Reset all failed migrations
      for (const migration of anyFailedMigration) {
        console.log(`Resetting migration: ${migration.migration_name}`);
        await prisma.$queryRaw`
          DELETE FROM _prisma_migrations 
          WHERE id = ${migration.id};
        `;
        console.log(`Migration ${migration.migration_name} reset successfully.`);
      }
    } else {
      // Reset the specific failed migration
      console.log(`Resetting migration: ${failedMigration[0].migration_name}`);
      await prisma.$queryRaw`
        DELETE FROM _prisma_migrations 
        WHERE id = ${failedMigration[0].id};
      `;
      console.log('Migration reset successfully.');
    }
    
    console.log('Migration fix process completed successfully.');
  } catch (error) {
    console.error('Error fixing migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix function
fixFailedMigration(); 