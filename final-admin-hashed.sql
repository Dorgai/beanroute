-- Create a final admin user with a properly hashed 'secret' password
INSERT INTO "User" (
  id, 
  username, 
  email, 
  password, 
  "firstName", 
  "lastName", 
  role, 
  status, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(), 
  'finaladmin', 
  'finaladmin@beanroute.com', 
  '$2a$10$JBdSUjkpU1fJdXGWOu1lKun4t1c/MnYVRfzdKwtmRWvZ8lcLr/A0e', -- bcrypt hash for 'secret'
  'Final', 
  'Admin', 
  'ADMIN', 
  'ACTIVE', 
  NOW(), 
  NOW()
);

-- Also update all existing admin users with the same hash
UPDATE "User" 
SET password = '$2a$10$JBdSUjkpU1fJdXGWOu1lKun4t1c/MnYVRfzdKwtmRWvZ8lcLr/A0e', 
    "updatedAt" = NOW()
WHERE username IN ('admin', 'newadmin', 'superadmin');

-- Verify the user
SELECT username, email, substring(password, 1, 30) as password_hash, role, status
FROM "User" 
WHERE role = 'ADMIN'; 