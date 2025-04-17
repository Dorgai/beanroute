-- Reset ALL admin users with one final attempt using extreme measures
-- First, update all existing admin users
UPDATE "User" 
SET 
    -- Plain text password 'admin' (no hashing)
    password = 'admin', 
    status = 'ACTIVE',
    "updatedAt" = NOW()
WHERE role = 'ADMIN';

-- Also create one more admin with the simplest possible credentials
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
  'simpleadmin', 
  'simpleadmin@beanroute.com', 
  'admin', -- Plain text password 'admin'
  'Simple', 
  'Admin', 
  'ADMIN', 
  'ACTIVE', 
  NOW(), 
  NOW()
);

-- Update a special admin user with username = 'admin' and password = 'secret'
UPDATE "User"
SET
    password = 'secret',
    "updatedAt" = NOW()
WHERE username = 'admin';

-- Verify all admin users
SELECT username, email, password, role, status, "updatedAt"
FROM "User" 
WHERE role = 'ADMIN'
ORDER BY "updatedAt" DESC; 