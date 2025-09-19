// Script to get auth token and fix duplicates
const https = require('https');

const BASE_URL = 'https://beanroute-production-3421.up.railway.app';

// First, let's try to get a token by logging in
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123' // You may need to update this with the correct password
    });

    const options = {
      hostname: 'beanroute-production-3421.up.railway.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Login response:', response);
          
          // Extract token from Set-Cookie header
          const setCookieHeader = res.headers['set-cookie'];
          if (setCookieHeader) {
            const authCookie = setCookieHeader.find(cookie => cookie.startsWith('auth='));
            if (authCookie) {
              const token = authCookie.split('auth=')[1].split(';')[0];
              console.log('Auth token extracted:', token ? 'Found' : 'Not found');
              resolve(token);
            } else {
              reject(new Error('No auth cookie found'));
            }
          } else {
            reject(new Error('No Set-Cookie header found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// Call the fix-duplicates endpoint with auth token
async function fixDuplicates(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'beanroute-production-3421.up.railway.app',
      port: 443,
      path: '/api/retail/orders?fixDuplicates=true',
      method: 'GET',
      headers: {
        'Cookie': `auth=${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Fix duplicates response:', response);
          resolve(response);
        } catch (error) {
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('=== GETTING AUTH TOKEN ===');
    const token = await getAuthToken();
    
    console.log('\n=== FIXING DUPLICATES ===');
    const result = await fixDuplicates(token);
    
    console.log('\n=== RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
