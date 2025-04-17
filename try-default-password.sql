-- Reset the admin user's password to 'secret' (the default value in the login form)
-- This hash is for 'secret'
UPDATE "User" 
SET password = '$2a$10$JBdSUjkpU1fJdXGWOu1lKun4t1c/MnYVRfzdKwtmRWvZ8lcLr/A0e', 
    "updatedAt" = NOW()
WHERE username = 'admin';

-- Verify the update
SELECT username, 
       substring(password, 1, 30) as password_prefix, 
       status, 
       role,
       "updatedAt"
FROM "User" 
WHERE username = 'admin'; 