#!/bin/bash

# Exit on error, but not for the database migration
set -e

echo "Starting application deployment..."

# Use the public database URL if available
if [ -n "$DATABASE_PUBLIC_URL" ]; then
  echo "Using public database URL..."
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
fi

# Use our fix-and-run script instead of the problematic steps
chmod +x ./fix-and-run.sh
./fix-and-run.sh 