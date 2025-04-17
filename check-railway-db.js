const { PrismaClient } = require('@prisma/client');

// Create a custom Prisma client with logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log queries for debugging
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

async function checkDatabaseConnection() {
  console.log('Checking database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//******:******@') : 
    'Not defined');
  
  try {
    // Test basic connection
    console.log('Testing basic connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Connection successful:', result);
    
    // Check if tables exist by examining PostgreSQL schema
    console.log('\nChecking PostgreSQL schema information...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\nFound ${tables.length} tables in database:`);
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Expected tables based on Prisma schema
    const expectedTables = [
      'User', 'Shop', 'Team', 'UserShop', 'UserTeam', 'Permission', 
      'Session', 'UserActivity', 'GreenCoffee', 'GreenCoffeeInventoryLog', 
      'RetailOrder', 'RetailOrderItem', 'RetailInventory'
    ].map(name => name.toLowerCase());
    
    // Check for missing tables
    const foundTables = tables.map(t => t.table_name.toLowerCase());
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\nMissing tables:');
      missingTables.forEach(table => console.log(`- ${table}`));
    } else {
      console.log('\nAll expected tables are present!');
    }
    
    // Create a mapping of table names to Prisma model names
    const tableToModelMap = {
      'greencoffee': 'greenCoffee',
      'greencoffeeinventorylog': 'greenCoffeeInventoryLog',
      'permission': 'permission',
      'retailinventory': 'retailInventory',
      'retailorder': 'retailOrder',
      'retailorderitem': 'retailOrderItem',
      'session': 'session',
      'shop': 'shop',
      'team': 'team',
      'user': 'user',
      'useractivity': 'userActivity',
      'usershop': 'userShop',
      'userteam': 'userTeam'
    };
    
    // Check record counts
    console.log('\nCounting records in each table:');
    const counts = {};
    
    for (const tableObj of tables) {
      const tableName = tableObj.table_name.toLowerCase();
      
      // Skip Prisma's migration table
      if (tableName === '_prisma_migrations') {
        continue;
      }
      
      try {
        // Get the corresponding Prisma model name
        const modelName = tableToModelMap[tableName];
        
        if (!modelName || !prisma[modelName]) {
          console.log(`- ${tableName}: Skipped (no matching Prisma model)`);
          continue;
        }
        
        const count = await prisma[modelName].count();
        counts[tableName] = count;
        console.log(`- ${tableName}: ${count} records`);
      } catch (err) {
        console.log(`- ${tableName}: Error - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseConnection()
  .then(() => console.log('Database check completed.'))
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 