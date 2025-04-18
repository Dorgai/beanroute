const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function resetFailedMigration() {
  console.log('Starting migration reset process...');
  
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
    console.log('Finding failed migrations...');
    const failedMigrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250417000000_add_inventory_alert_system' 
      AND applied_steps_count < finished_at IS NULL;
    `;
    
    if (failedMigrations.length === 0) {
      console.log('No failed migrations found.');
      
      // Check if there are any migrations
      const allMigrations = await prisma.$queryRaw`SELECT * FROM _prisma_migrations;`;
      console.log(`Found ${allMigrations.length} migrations in total.`);
      
      if (allMigrations.length > 0) {
        console.log('Resetting the most recent migration to force clean state...');
        const latestMigration = allMigrations.sort((a, b) => 
          new Date(b.started_at) - new Date(a.started_at)
        )[0];
        
        console.log(`Resetting migration: ${latestMigration.migration_name}`);
        await prisma.$queryRaw`
          DELETE FROM _prisma_migrations 
          WHERE id = ${latestMigration.id};
        `;
        console.log('Migration reset successfully.');
      }
      
      return;
    }
    
    console.log(`Found ${failedMigrations.length} failed migrations. Resetting...`);
    
    // Delete the failed migration record
    for (const migration of failedMigrations) {
      console.log(`Resetting migration: ${migration.migration_name}`);
      await prisma.$queryRaw`
        DELETE FROM _prisma_migrations 
        WHERE id = ${migration.id};
      `;
    }
    
    console.log('Failed migrations reset successfully.');
    
    // Generate fresh Prisma client
    console.log('Generating fresh Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Migration reset process completed successfully.');
  } catch (error) {
    console.error('Error resetting migrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetFailedMigration()
  .catch(error => {
    console.error('Failed to reset migrations:', error);
    process.exit(1);
  }); 