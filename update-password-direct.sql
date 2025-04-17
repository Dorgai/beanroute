-- Reset the admin user's password directly 
-- This hash is for 'admin123' but with a different salt than before
UPDATE "User" 
SET password = '$2a$10$yPQi/0t89VQAN36PCNuugu4Ik6V5nDqcK8Zp3qZJr7bEd4q.e4ITS', 
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