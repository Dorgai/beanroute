#!/bin/bash

# Start the application with the local database
echo "Starting application with local database..."

# Define local database URL
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/user_management"

# Start the app with the local database URL
echo "Running with: DATABASE_URL=$LOCAL_DB_URL npm run dev"
DATABASE_URL="$LOCAL_DB_URL" npm run dev 