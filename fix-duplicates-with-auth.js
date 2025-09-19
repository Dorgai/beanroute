const https = require('https');

// First, let's login to get a token
async function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
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
          
          if (response.message === 'Login successful') {
            console.log('Login successful, but no token in response');
            // The token is set as a cookie, we need to extract it
            const setCookieHeader = res.headers['set-cookie'];
            if (setCookieHeader) {
              const authCookie = setCookieHeader.find(cookie => cookie.startsWith('auth='));
              if (authCookie) {
                const token = authCookie.split('=')[1].split(';')[0];
                console.log('Extracted token from cookie');
                resolve(token);
              } else {
                console.error('No auth-token cookie found');
                reject(new Error('No auth-token cookie found'));
              }
            } else {
              console.error('No set-cookie header found');
              reject(new Error('No set-cookie header found'));
            }
          } else {
            console.error('Login failed:', response);
            reject(new Error('Login failed'));
          }
        } catch (error) {
          console.error('Error parsing login response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Login request error:', error);
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// Then call the fix-duplicates API
async function fixDuplicates(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'beanroute-production-3421.up.railway.app',
      port: 443,
      path: '/api/fix-duplicates-now',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
          console.error('Error parsing fix-duplicates response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Fix duplicates request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('=== FIXING DUPLICATE ITEMS WITH AUTHENTICATION ===');
    
    // Step 1: Login
    const token = await login();
    
    // Step 2: Fix duplicates
    const result = await fixDuplicates(token);
    
    console.log('=== COMPLETED ===');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
