// Simple migration runner for Railway production
// This script will run both migrations to fix the issues

const PRODUCTION_URL = 'https://beanroute-production-3421.up.railway.app';

async function runMigration(endpoint, description) {
  try {
    console.log(`🔄 Running ${description}...`);
    
    const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} completed successfully:`, data.message);
      return true;
    } else {
      console.error(`❌ ${description} failed:`, data.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} error:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting Railway Production Migrations...\n');
  
  // Run shop schema migration first
  const shopSuccess = await runMigration(
    '/api/admin/fix-shop-schema',
    'Shop Schema Migration'
  );
  
  if (!shopSuccess) {
    console.log('\n❌ Shop schema migration failed. Stopping.');
    return;
  }
  
  console.log('');
  
  // Run push subscription migration
  const pushSuccess = await runMigration(
    '/api/admin/fix-push-subscriptions',
    'Push Subscription Migration'
  );
  
  if (!pushSuccess) {
    console.log('\n❌ Push subscription migration failed.');
    return;
  }
  
  console.log('\n🎉 All migrations completed successfully!');
  console.log('✅ Shop selector should now work');
  console.log('✅ Push notifications should now work');
  console.log('\n🔗 Test your app at:', PRODUCTION_URL);
}

// Run the migrations
runAllMigrations().catch(console.error);
