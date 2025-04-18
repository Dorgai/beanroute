// This script uses the pg library to directly connect to the database
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function directDatabaseFix() {
  console.log('Starting direct database fix...');
  
  // Use Railway's DATABASE_PUBLIC_URL environment variable which is accessible externally
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  console.log(`Using connection string: ${connectionString.substring(0, 40)}...`);
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false  // Required for Railway's database connection
    }
  });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database successfully!');
    
    // First check if there's a user with our needed ID
    const checkExactIdQuery = `
      SELECT * FROM "User" WHERE id = '30a0234d-e4f6-44b1-bb31-587185a1d4ba';
    `;
    
    console.log('Checking for user with exact ID...');
    const exactIdResult = await client.query(checkExactIdQuery);
    
    if (exactIdResult.rows.length > 0) {
      console.log('User with target ID already exists! Updating...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update user
      const updateQuery = `
        UPDATE "User"
        SET status = 'ACTIVE', password = $1
        WHERE id = '30a0234d-e4f6-44b1-bb31-587185a1d4ba'
        RETURNING id, username, email, role, status;
      `;
      
      const updateResult = await client.query(updateQuery, [hashedPassword]);
      console.log('User updated successfully:', updateResult.rows[0]);
    } else {
      // The user with the required ID doesn't exist, so we need to create a new one
      console.log('User with target ID does not exist. Creating new user...');
      
      // Create a username that won't conflict with existing admin
      const username = 'admin2';
      const email = 'admin2@beanroute.com';
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create user with the specific ID we need
      const insertQuery = `
        INSERT INTO "User" (
          id, username, email, password, role, status, "createdAt", "updatedAt"
        ) VALUES (
          '30a0234d-e4f6-44b1-bb31-587185a1d4ba',
          $1,
          $2,
          $3,
          'ADMIN',
          'ACTIVE',
          NOW(),
          NOW()
        ) RETURNING id, username, email, role, status;
      `;
      
      console.log(`Creating new user with username: ${username}, email: ${email}`);
      const insertResult = await client.query(insertQuery, [username, email, hashedPassword]);
      console.log('User created successfully:', insertResult.rows[0]);
      
      // Get shop ID (to connect user to)
      const getShopQuery = `SELECT id FROM "Shop" LIMIT 1;`;
      const shopResult = await client.query(getShopQuery);
      
      if (shopResult.rows.length > 0) {
        const shopId = shopResult.rows[0].id;
        console.log(`Found shop with ID: ${shopId}`);
        
        // Check if user is already connected to shop
        const checkUserShopQuery = `
          SELECT * FROM "UserShop" 
          WHERE "userId" = '30a0234d-e4f6-44b1-bb31-587185a1d4ba'
          AND "shopId" = $1;
        `;
        
        const userShopResult = await client.query(checkUserShopQuery, [shopId]);
        
        if (userShopResult.rows.length === 0) {
          // Connect user to shop - UserShop has a composite primary key of userId and shopId
          const insertUserShopQuery = `
            INSERT INTO "UserShop" (
              "userId", "shopId", role, "createdAt", "updatedAt"
            ) VALUES (
              '30a0234d-e4f6-44b1-bb31-587185a1d4ba',
              $1,
              'ADMIN',
              NOW(),
              NOW()
            );
          `;
          
          await client.query(insertUserShopQuery, [shopId]);
          console.log('Connected user to shop successfully');
        } else {
          console.log('User already connected to shop');
        }
      } else {
        console.log('No shops found to connect user to.');
      }
      
      // Print login credentials
      console.log('==== LOGIN CREDENTIALS ====');
      console.log(`Username: ${username}`);
      console.log('Password: admin123');
      console.log('=========================');
    }
    
    console.log('Database operation completed successfully!');
  } catch (error) {
    console.error('Error during database operation:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

directDatabaseFix()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 