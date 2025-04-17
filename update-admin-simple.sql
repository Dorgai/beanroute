-- Reset the admin user's password to 'admin123' with a simple bcrypt hash
-- This is a bcrypt hash for 'admin123' with complexity factor 10
UPDATE "User" 
SET password = '$2a$10$Bk4F.Hm8sUCzcHKORYQQEOD1i4qKIyS569GUsSYNtO9.UcWLJLpZm', 
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