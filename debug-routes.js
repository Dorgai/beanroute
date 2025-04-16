const fs = require('fs');
const path = require('path');

// Function to check if a file is a page
function isPage(file) {
  return !file.startsWith('_') && !file.startsWith('.') && 
         (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx'));
}

// Function to get all pages in a directory
function getPagesInDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  const routes = [];

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    const relativePath = path.relative(pagesDir, itemPath);
    
    if (item.isDirectory()) {
      // Recursively get pages in subdirectory
      routes.push(...getPagesInDirectory(itemPath));
    } else if (isPage(item.name)) {
      // Convert file path to route
      let route = '/' + relativePath
        .replace(/\\/g, '/')
        .replace(/\.(js|jsx|tsx)$/, '')
        .replace(/\/index$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1');
      
      if (route === '') {
        route = '/';
      }
      
      routes.push(route);
    }
  }

  return routes;
}

// Get root pages directory
const pagesDir = path.join(__dirname, 'src', 'pages');
const routes = getPagesInDirectory(pagesDir);

// Sort routes for better readability
routes.sort();

console.log('Available routes:');
routes.forEach(route => console.log(route)); 