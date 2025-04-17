const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  console.log('Introspecting database schema...');
  
  try {
    // Run Prisma db pull to introspect the database
    console.log('Running prisma db pull...');
    const pullOutput = execSync('npx prisma db pull', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(pullOutput);
    
    // Check if the schema.prisma file exists
    if (fs.existsSync('./prisma/schema.prisma')) {
      console.log('Schema file exists. Reading contents...');
      const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8');
      
      // Check for specific model definitions in the schema
      const requiredModels = [
        'User', 'Shop', 'Team', 'UserShop', 'UserTeam', 'Permission', 
        'Session', 'UserActivity', 'GreenCoffee', 'GreenCoffeeInventoryLog', 
        'RetailOrder', 'RetailOrderItem', 'RetailInventory'
      ];
      
      const missingModels = [];
      for (const model of requiredModels) {
        if (!schemaContent.includes(`model ${model} {`)) {
          missingModels.push(model);
        }
      }
      
      if (missingModels.length > 0) {
        console.log('Missing models in the schema:', missingModels);
      } else {
        console.log('All required models are present in the schema!');
      }
      
      // Connect to database and check tables
      const prisma = new PrismaClient();
      try {
        console.log('\nConnecting to database to verify tables...');
        
        // Test connection
        await prisma.$queryRaw`SELECT 1 as connection_test`;
        console.log('Database connection successful!');
        
        // Check for tables in the database
        const tableCount = {};
        for (const model of requiredModels) {
          try {
            // Try to get a count from each table
            const count = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].count();
            tableCount[model] = count;
          } catch (err) {
            tableCount[model] = `Error: ${err.message}`;
          }
        }
        
        console.log('\nTable counts in database:');
        console.log(JSON.stringify(tableCount, null, 2));
        
      } catch (error) {
        console.error('Database connection error:', error);
      } finally {
        await prisma.$disconnect();
      }
      
    } else {
      console.log('Error: schema.prisma file not found after introspection!');
    }
  } catch (error) {
    console.error('Introspection failed:', error.message);
    if (error.stdout) console.log('Output:', error.stdout.toString());
    if (error.stderr) console.log('Error:', error.stderr.toString());
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 