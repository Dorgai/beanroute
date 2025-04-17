-- Reset the admin user's password directly using exact value 'admin123' without any hashing
-- WARNING: This is for troubleshooting only and is not secure
UPDATE "User" 
SET password = 'admin123', 
    "updatedAt" = NOW()
WHERE username = 'admin';

-- Verify the update
SELECT username, 
       password,
       status, 
       role,
       "updatedAt"
FROM "User" 
WHERE username = 'admin'; 