#!/bin/bash

# Start the development server with the right environment
echo "Starting development server with local database configuration..."

# Define database connection string
DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Create .env.development file (Next.js automatically loads this for dev)
echo "Creating .env.development file..."
cat > .env.development << EOF
# Development Environment Variables for Next.js (auto-loaded)
DATABASE_URL="${DB_URL}"
NODE_ENV="development"
SEED_DATABASE="true"
EOF

# Also create .env for any direct Node.js processes
echo "Creating .env file..."
cat > .env << EOF
# Database configuration
DATABASE_URL="${DB_URL}"
# Other environment variables
NODE_ENV="development"
SEED_DATABASE="true"
EOF

# First, run our database initialization script
echo "Initializing database connection..."
chmod +x ./init-db.js
DATABASE_URL="${DB_URL}" NODE_ENV=development ./init-db.js

# Check if initialization failed
if [ $? -ne 0 ]; then
    echo "Database initialization failed! Check the logs above for details."
    exit 1
fi

# Now start Next.js on port 3001
echo "Starting Next.js on port 3001..."
PORT=3001 DATABASE_URL="${DB_URL}" npm run dev 