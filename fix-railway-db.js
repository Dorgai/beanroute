// Railway Database Fix Script
// This script connects to your Railway PostgreSQL service and fixes the schema issues

import { Client } from 'pg';

// Railway PostgreSQL connection details
// You'll need to get these from your Railway PostgreSQL service
const config = {
  host: process.env.RAILWAY_PG_HOST || 'localhost',
  port: process.env.RAILWAY_PG_PORT || 5432,
  database: process.env.RAILWAY_PG_DATABASE || 'railway',
  user: process.env.RAILWAY_PG_USER || 'postgres',
  password: process.env.RAILWAY_PG_PASSWORD || '',
  ssl: process.env.RAILWAY_PG_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function fixDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    console.log('🚀 Starting database fixes...\n');

    // 1. Fix Shop table
    console.log('🔄 Fixing Shop table...');
    
    try {
      // Add minCoffeeQuantityEspresso column
      await client.query(`
        ALTER TABLE "public"."Shop" 
        ADD COLUMN IF NOT EXISTS "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('  ✅ Added minCoffeeQuantityEspresso column');
    } catch (error) {
      console.log('  ℹ️  minCoffeeQuantityEspresso column already exists or error:', error.message);
    }

    try {
      // Add minCoffeeQuantityFilter column
      await client.query(`
        ALTER TABLE "public"."Shop" 
        ADD COLUMN IF NOT EXISTS "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('  ✅ Added minCoffeeQuantityFilter column');
    } catch (error) {
      console.log('  ℹ️  minCoffeeQuantityFilter column already exists or error:', error.message);
    }

    console.log('');

    // 2. Create PushSubscription table
    console.log('🔄 Fixing PushSubscription table...');
    
    try {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PushSubscription';
      `);
      
      if (tableCheck.rows.length === 0) {
        console.log('  ➕ Creating PushSubscription table...');
        
        // Create the table
        await client.query(`
          CREATE TABLE "public"."PushSubscription" (
            "id" TEXT NOT NULL,
            "endpoint" TEXT NOT NULL,
            "p256dh" TEXT NOT NULL,
            "auth" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
          );
        `);
        
        // Create indexes
        await client.query(`
          CREATE INDEX "PushSubscription_userId_idx" 
          ON "public"."PushSubscription"("userId");
        `);
        
        await client.query(`
          CREATE INDEX "PushSubscription_endpoint_idx" 
          ON "public"."PushSubscription"("endpoint");
        `);
        
        // Add foreign key constraint
        await client.query(`
          ALTER TABLE "public"."PushSubscription" 
          ADD CONSTRAINT "PushSubscription_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        
        console.log('  ✅ PushSubscription table created with indexes and constraints');
      } else {
        console.log('  ✅ PushSubscription table already exists');
      }
    } catch (error) {
      console.log('  ❌ Error with PushSubscription table:', error.message);
    }

    console.log('\n🎉 Database fixes completed!');
    console.log('✅ Shop selector should now work');
    console.log('✅ Push notifications should now work');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    return { success: false, error: error.message };
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fix
fixDatabase()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All database fixes completed successfully!');
      console.log('\n🔗 Now test your app at: https://beanroute-production-3421.up.railway.app');
      process.exit(0);
    } else {
      console.log('\n❌ Database fixes failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }); 