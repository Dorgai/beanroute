const { execSync } = require('child_process');

// User ID that needs to be created
const ADMIN_ID = '30a0234d-e4f6-44b1-bb31-587185a1d4ba';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_EMAIL = 'admin@beanroute.com';

// Run the SQL command directly using Railway's exec feature
try {
  console.log('=== Creating admin user in production database ===');
  console.log(`User ID: ${ADMIN_ID}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  
  const command = `railway service exec postgres bash -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -h \$PGHOST -p \$PGPORT -U \$PGUSER -d \$PGDATABASE -c \\"INSERT INTO \\\\\\"\\"public\\\\\\".\\\\\\"\\"User\\\\\\"\\"\\\\\\"\\" (id, username, email, password, role, status, \\\\\\"\\"createdAt\\\\\\"\\")\
    VALUES ('${ADMIN_ID}', 'admin', '${ADMIN_EMAIL}', '$2a$10$\\\\\\"\\"1f2XU3h9b7XhBhbdILFE.uJkTQUJIK2aJ4H4VJA.pLzpYEKyLe\\\\\\"\\"', 'ADMIN', 'ACTIVE', NOW())\
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE', password = '$2a$10$\\\\\\"\\"1f2XU3h9b7XhBhbdILFE.uJkTQUJIK2aJ4H4VJA.pLzpYEKyLe\\\\\\"\\"'\\"" && echo "Admin user created successfully: ${ADMIN_ID}"`;
  
  console.log('Executing command...');
  const result = execSync(command, { encoding: 'utf8' });
  console.log(result);
  
  console.log('=== Successfully created admin user ===');
  console.log('Login Credentials:');
  console.log(`Username: admin`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`User ID: ${ADMIN_ID}`);
} catch (error) {
  console.error('Error creating admin user:', error.message);
  process.exit(1);
} 