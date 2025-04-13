const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeDatabase } = require('./db-init');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  // Start the server first
  await app.prepare();
  
  // Create and start the HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse the request URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    
    // Setup the database after the server is already listening
    // This way the health check can succeed even if DB setup is still in progress
    initializeDatabase().then(success => {
      if (success) {
        console.log('✅ Database setup completed after server start');
      } else {
        console.warn('⚠️ Database setup failed, but server is still running');
        console.warn('⚠️ Some features may not work until database is properly set up');
      }
    }).catch(err => {
      console.error('Database setup error:', err);
    });
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 