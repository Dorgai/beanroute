-- Check admin user details
SELECT username, email, role, status, 
       substring(password, 1, 30) as password_prefix 
FROM "User" 
WHERE username = 'admin'; 