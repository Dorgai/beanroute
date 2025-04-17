// Instructions for using emergency access on the login page

/*
The login page at https://beanroute-production-3421.up.railway.app/login 
appears to have an "Emergency Access" button based on the code we've seen.

This button bypasses the normal authentication process and instead:
1. Creates a temporary admin user in the browser's localStorage
2. Redirects directly to the orders page

You can try the following:
1. Go to https://beanroute-production-3421.up.railway.app/login
2. Click the "Emergency Access" button at the bottom of the login form
3. You should be automatically logged in as an admin user

Alternatively, you can now try to login with:
1. Username: superadmin
2. Password: password123

Or with the original admin user:
1. Username: admin
2. Password: admin123

If none of these work, there might be an issue with how the application
is handling authentication or cookies.
*/ 