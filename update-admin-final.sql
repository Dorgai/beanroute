-- Generate an updated admin user with standard bcrypt password for 'admin'
-- This is a standard hash for the string 'admin'
UPDATE "User" 
SET password = '$2a$10$2.wQXyjxxhx5tTwwPNk4l.4rCijN0uIrR5K89E.Lz4Z1FLlD/Y/om', 
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