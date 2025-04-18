const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
  console.log('Starting schema fix application...');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // Check if Shop table exists and has city column
    console.log('Checking if Shop table has city column...');
    const hasCity = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Shop'
        AND column_name = 'city'
      );
    `;
    
    if (hasCity[0].exists) {
      console.log('Shop table already has city column. No fix needed.');
      return;
    }
    
    console.log('Shop table needs schema fix. Applying SQL script...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(`${statement};`);
        console.log('SQL statement executed successfully');
      } catch (sqlError) {
        console.error('Error executing SQL statement:', sqlError);
        console.error('Statement:', statement);
      }
    }
    
    console.log('Schema fix completed successfully!');
  } catch (error) {
    console.error('Error applying schema fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix function
applySchemaFix(); 