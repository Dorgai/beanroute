-- Reset the admin user's password to 'adminisztrator'
-- This hash is for 'adminisztrator'
UPDATE "User" 
SET password = '$2b$10$lJiffCG5QGKq8ChmPwa1X.ZHQPOeslO8Fi868pm8EepVNDSFhe1TS', 
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