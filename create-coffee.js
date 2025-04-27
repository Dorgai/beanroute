// Script to create a sample green coffee entry
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function createSampleCoffee() {
  console.log('Starting coffee creation process...');
  
  // Check if running on Railway
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    console.log('Running in Railway environment');
    
    // Use PUBLIC_URL for database connection if available
    if (process.env.DATABASE_PUBLIC_URL) {
      console.log('Using DATABASE_PUBLIC_URL for connection');
      process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
    }
  }
  
  // Create prisma client
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    console.log('Database URL: ' + (process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'Not set'));
    await prisma.$connect();
    
    // First, verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection verified ✓');
    
    // Find the admin user to set as creator
    console.log('Looking up admin user...');
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found. Cannot create coffee without a creator.');
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Check tables in the database
    console.log('Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = tables.map(t => t.table_name.toLowerCase());
    console.log('Available tables:', tableNames.join(', '));
    
    // Get the schema information for GreenCoffee
    console.log('Checking GreenCoffee schema structure...');
    const greenCoffeeModel = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee'
    `;
    
    console.log('Available fields in GreenCoffee table:', greenCoffeeModel.map(col => col.column_name).join(', '));
    
    // Create a new coffee entry directly with quantity
    const newCoffee = await prisma.greenCoffee.create({
      data: {
        name: 'Ethiopia Yirgacheffe',
        country: 'Ethiopia',
        producer: 'Yirgacheffe Cooperative',
        notes: 'Floral, citrus, bergamot',
        grade: 'SPECIALTY',
        createdById: adminUser.id,
        quantity: 180 // Set quantity directly on the GreenCoffee model
      }
    });
    
    console.log(`Created new coffee entry with ID: ${newCoffee.id} and quantity: ${newCoffee.quantity}kg`);
    
    // Create inventory log if the table exists
    if (tableNames.includes('greencoffeeinventorylog')) {
      try {
        console.log('Creating inventory log entry...');
        const inventoryLog = await prisma.greenCoffeeInventoryLog.create({
          data: {
            coffeeId: newCoffee.id,
            userId: adminUser.id,
            changeAmount: 180,
            quantity: 180,
            notes: 'Initial inventory'
          }
        });
        console.log(`Created inventory log entry with ID: ${inventoryLog.id}`);
      } catch (logError) {
        console.error('Error creating inventory log:', logError.message);
      }
    } else {
      console.log('GreenCoffeeInventoryLog table not found, skipping log creation');
    }
    
    console.log('\nCoffee creation completed successfully');
    
  } catch (error) {
    console.error('Error creating coffee:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSampleCoffee().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 