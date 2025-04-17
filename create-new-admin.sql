-- Create a new admin user with username 'superadmin' and password 'password123'
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
  'superadmin', 
  'superadmin@beanroute.com', 
  '$2a$10$u3A2zhp40Z.UY5vclTzyWOaQWH.XhJxCU2y0mIsO9KXI3Vv2UBDGy', -- bcrypt hash for 'password123'
  'Super', 
  'Admin', 
  'ADMIN', 
  'ACTIVE', 
  NOW(), 
  NOW()
);

-- Verify the new user
SELECT username, email, role, status, 
       substring(password, 1, 30) as password_prefix,
       "createdAt"
FROM "User" 
WHERE username = 'superadmin'; 