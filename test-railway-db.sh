#!/bin/bash

# Test connection to Railway's PostgreSQL database
echo "Testing connection to Railway's PostgreSQL database..."

# Function to extract host and port from a PostgreSQL URL
function extract_host_port() {
  local url=$1
  local host_port=$(echo $url | sed -n 's/.*@\([^/]*\).*/\1/p')
  echo $host_port
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  echo "Please run this script after connecting to Railway CLI:"
  echo "railway run ./test-railway-db.sh"
  exit 1
fi

# Extract host and port
HOST_PORT=$(extract_host_port "$DATABASE_URL")
echo "Attempting to connect to: $HOST_PORT"

# Try a simple ping to the host
HOST=$(echo $HOST_PORT | cut -d':' -f1)
PORT=$(echo $HOST_PORT | cut -d':' -f2)

echo "Checking if $HOST is reachable..."
ping -c 1 $HOST

echo "Checking if PostgreSQL is accessible on $HOST:$PORT..."
nc -zv $HOST $PORT 2>&1

echo "Checking database with pg_isready..."
pg_isready -h $HOST -p $PORT

# Show Railway connection details
echo "Railway DATABASE_URL format:"
echo $DATABASE_URL | sed 's/postgresql:\/\/\([^:]*\):\([^@]*\)@/postgresql:\/\/\1:********@/'

# Test with psql
echo "Attempting to list databases with psql..."
PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p') psql -h $HOST -p $PORT -U postgres -c "\l" 2>&1 || echo "Failed to connect with psql"

echo "Testing connection complete!"
echo "If you're having issues connecting, check Railway documentation or contact Railway support." 