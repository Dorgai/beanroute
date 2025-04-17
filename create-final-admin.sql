-- Create a new admin user with the simplest approach
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
  'newadmin', 
  'newadmin@beanroute.com', 
  'secret', -- Using plain text password for testing
  'New', 
  'Admin', 
  'ADMIN', 
  'ACTIVE', 
  NOW(), 
  NOW()
);

-- Verify the new user
SELECT username, email, password, role, status
FROM "User" 
WHERE username = 'newadmin'; 