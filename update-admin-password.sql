-- Update admin password using a different bcrypt hash
-- This is a different bcrypt hash of 'admin123' using a different salt
UPDATE "User" 
SET password = '$2a$10$Xm5gK9vWBkv49ni81dXC5Ou8X7WrKxmx1gK0cyZhnXKvKTrLVhLVy', 
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