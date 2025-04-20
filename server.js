const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Function to initialize the database
async function initDatabase() {
  console.log('=== Initializing Database ===');
  
  try {
    // Check if prisma schema exists
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.error('ERROR: Prisma schema not found at', schemaPath);
      
      // For Railway, try to find schema elsewhere
      const possibleLocations = [
        path.join(__dirname, 'schema.prisma'),
        path.join(__dirname, 'prisma.schema'),
        path.join(__dirname, 'prisma', 'prisma.schema')
      ];
      
      let found = false;
      for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
          console.log('Found schema at alternative location:', location);
          // Create directory if needed
          if (!fs.existsSync(path.dirname(schemaPath))) {
            fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
          }
          fs.copyFileSync(location, schemaPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error('Could not find Prisma schema in any location!');
        // Continue anyway, as this may be a non-DB deployment
      }
    }
    
    // If prisma schema exists, generate client and push schema
    if (fs.existsSync(schemaPath)) {
      console.log('Running database initialization...');
      
      try {
        // Generate Prisma client
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        // Push schema to database (in production we might want to use migrations instead)
        execSync('npx prisma db push', { stdio: 'inherit' });
        
        console.log('Database initialization successful!');
      } catch (error) {
        console.error('Database initialization error:', error.message);
        // Continue anyway to allow app to start even if DB is not ready
      }
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
    // Continue anyway - the app might work in limited capacity
  }
}

// Start the server
async function startServer() {
  try {
    // Initialize database first
    await initDatabase();
    
    // Then prepare Next.js
    await app.prepare();

    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> BeanRoute ready on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start everything
startServer(); 