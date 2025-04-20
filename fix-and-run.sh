#!/bin/sh

echo "=== Starting BeanRoute with Database Migration Fix ==="

# Run the database initialization with migration fixes
node init-db.js

# Start the Next.js server with the proper port
next start -p ${PORT:-8080} 