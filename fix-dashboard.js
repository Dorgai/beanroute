/*
If you can access the dashboard page but it's not loading data, try these steps:

1. Open your browser's developer tools (F12 or right-click and select "Inspect")

2. Go to the "Console" tab and look for any error messages that might indicate 
   what's failing

3. Go to the "Application" tab, then:
   - Select "Local Storage" in the left sidebar
   - Look for an entry for the domain (beanroute-production-3421.up.railway.app)
   - If there's no "user" entry, you'll need to create one

4. In the console, try running this code to create a temporary admin user:

   localStorage.setItem('user', JSON.stringify({
     id: 'direct-' + Date.now(),
     username: 'admin',
     email: 'admin@example.com',
     firstName: 'Admin',
     lastName: 'User',
     role: 'ADMIN'
   }));

5. After running that code, refresh the page and see if the dashboard loads

6. If you're still having issues, check the "Network" tab in developer tools
   to see which API requests are failing and what errors they're returning

7. You might also try accessing these direct URLs:
   - https://beanroute-production-3421.up.railway.app/orders
   - https://beanroute-production-3421.up.railway.app/users
*/ 