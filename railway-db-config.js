// Railway Database Configuration
// Copy this file to .env.local and fill in your Railway PostgreSQL details

module.exports = {
  // Get these values from your Railway PostgreSQL service
  RAILWAY_PG_HOST: 'your-railway-postgres-host.railway.app',
  RAILWAY_PG_PORT: 5432,
  RAILWAY_PG_DATABASE: 'railway',
  RAILWAY_PG_USER: 'postgres',
  RAILWAY_PG_PASSWORD: 'your-railway-postgres-password',
  RAILWAY_PG_SSL: 'true'
};

// To get these values:
// 1. Go to railway.app
// 2. Select your beanroute project
// 3. Click on the PostgreSQL service
// 4. Look for "Connect" or connection details
// 5. Copy the host, port, database, user, and password
// 6. Update the values above
// 7. Run: node fix-railway-db.js 