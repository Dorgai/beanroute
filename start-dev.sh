#!/bin/bash

# Start the development server with the right environment
echo "Starting development server with local database configuration..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Local environment file (.env.local) not found!"
    echo "Run ./setup-local-db.sh first to set up local database."
    exit 1
fi

# Load environment variables from .env.local 
export $(grep -v '^#' .env.local | xargs)

# Start the development server
echo "Starting Next.js development server..."
npm run dev 