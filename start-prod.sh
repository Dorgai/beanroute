#!/bin/bash

# Start the production server for Railway deployment
echo "Starting production server for Railway deployment..."

# Check if DATABASE_URL and DIRECT_DATABASE_URL are set
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_DATABASE_URL" ]; then
    echo "Error: DATABASE_URL and DIRECT_DATABASE_URL must be set for production deployment."
    echo "These should be set automatically by Railway deployment."
    exit 1
fi

# Set NODE_ENV to production if not already set
export NODE_ENV=production

# Run Prisma migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Start the production server
echo "Starting Node.js production server..."
node server.js 