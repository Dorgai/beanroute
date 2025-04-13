#!/bin/sh

echo "Deploying database schema using Prisma Migrate..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Cannot run migrations."
  exit 1
fi

# Run Prisma migrations
# This command applies pending migrations found in the prisma/migrations folder.
# It's the standard way to keep the database schema in sync with the Prisma schema.
npx prisma migrate deploy

# Check the exit status of the migration command
if [ $? -eq 0 ]; then
  echo "✅ Prisma migrations applied successfully!"
else
  echo "❌ Prisma migrations failed!"
  # Optionally exit if migrations are critical, or allow continuation
  # exit 1 
  echo "⚠️ Continuing deployment despite migration failure..."
fi

# Optional: Run seed script after migrations if needed in production
# echo "Running database seed script..."
# npx prisma db seed
# if [ $? -eq 0 ]; then
#   echo "✅ Database seeding completed successfully!"
# else
#   echo "⚠️ Database seeding failed."
# fi 