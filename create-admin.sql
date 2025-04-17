-- First check if we can connect
SELECT 1 AS connection_test;

-- Check if User table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'User'
);

-- Insert or update admin user
DO $$
DECLARE
  admin_exists BOOLEAN;
  admin_id TEXT;
  -- This is a bcrypt hash of 'admin123'
  hashed_password TEXT := '$2a$10$kxljV5GpRwEST9.ulCDz7.A7MdY3OkCrLYUyxsPwVG9JQtFN.pRbW';
BEGIN
  -- Check if admin user exists
  SELECT EXISTS (SELECT 1 FROM "User" WHERE username = 'admin') INTO admin_exists;
  
  IF admin_exists THEN
    -- Update existing admin user
    UPDATE "User" SET 
      password = hashed_password,
      role = 'ADMIN',
      status = 'ACTIVE',
      "updatedAt" = NOW()
    WHERE username = 'admin'
    RETURNING id INTO admin_id;
    
    RAISE NOTICE 'Admin user updated with ID: %', admin_id;
  ELSE
    -- Create new admin user
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
      'admin', 
      'admin@beanroute.com', 
      hashed_password, 
      'Admin', 
      'User', 
      'ADMIN', 
      'ACTIVE', 
      NOW(), 
      NOW()
    ) RETURNING id INTO admin_id;
    
    RAISE NOTICE 'New admin user created with ID: %', admin_id;
  END IF;
  
  -- Log admin creation in UserActivity table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserActivity') THEN
    INSERT INTO "UserActivity" (
      id, 
      "userId", 
      action, 
      resource, 
      "resourceId", 
      details, 
      "createdAt"
    ) VALUES (
      gen_random_uuid(), 
      admin_id, 
      'ADMIN_CREATE_OR_UPDATE', 
      'USER', 
      admin_id, 
      'Admin user created or updated via direct database script', 
      NOW()
    );
  END IF;
END $$;

-- Verify admin user details
SELECT id, username, email, role, status, "createdAt", "updatedAt",
       substring(password, 1, 10) || '...' as password_hash 
FROM "User" 
WHERE username = 'admin'; 