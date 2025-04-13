#!/bin/bash

# Deploy migrations to Railway database
echo "Deploying database migrations to Railway..."

# Check if we have DATABASE_URL in the environment
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please ensure you're connected to Railway CLI or set the variable manually"
  exit 1
fi

# Show the database we're connecting to (masked)
MASKED_URL=$(echo $DATABASE_URL | sed 's/postgresql:\/\/[^:]*:[^@]*@/postgresql:\/\/user:password@/')
echo "Target database: $MASKED_URL"

# Try to run the migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Check the result
if [ $? -eq 0 ]; then
  echo "✅ Migrations successfully deployed to Railway!"
  
  # Optional: seed the database
  read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding the database..."
    npx prisma db seed
  fi
else
  echo "❌ Migration failed. Please check the error messages above."
fi 