const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { ensureAdminExists } = require('./init-db');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    // Prepare Next.js
    await app.prepare();
    
    // Start database initialization and admin user creation in parallel
    const dbInitPromise = ensureAdminExists();
    
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
    
    // Start listening for requests
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });

    // Wait for database initialization to complete
    try {
      const adminUser = await dbInitPromise;
      console.log('✅ Admin user setup completed:', adminUser.username);
    } catch (err) {
      console.error('⚠️ Admin setup failed, but server is still running:', err.message);
      console.warn('⚠️ Authentication functionality may not work properly');
    }
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Start the server
startServer(); 