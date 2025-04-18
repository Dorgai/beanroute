#!/bin/sh

echo "=== Starting BeanRoute with Migration Fix ==="

# Run the database initialization with migration fixes
node init-db.js

# Start the Next.js server
next start -p ${PORT:-3000} 