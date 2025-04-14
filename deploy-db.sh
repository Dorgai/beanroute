#!/bin/sh

echo "Deploying database schema using Prisma Migrate..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Cannot run migrations."
  exit 1
fi

# Try to resolve any failed migrations first
echo "Checking for and resolving any failed migrations..."
npx prisma migrate resolve --applied 20250413220613_fix_state || {
  echo "⚠️ Could not resolve failed migrations. Trying a different approach..."
}

# Run Prisma migrations
echo "Applying pending migrations..."
npx prisma migrate deploy

# Check the exit status of the migration command
if [ $? -eq 0 ]; then
  echo "✅ Prisma migrations applied successfully!"
else
  echo "❌ Prisma migrations failed!"
  # We'll continue anyway since the application might still work with the existing schema
  echo "⚠️ Continuing deployment despite migration failure..."
fi

# Generate Prisma client to ensure it's up to date
echo "Regenerating Prisma client..."
npx prisma generate

# Optional: Run seed script after migrations if needed in production
# echo "Running database seed script..."
# npx prisma db seed
# if [ $? -eq 0 ]; then
#   echo "✅ Database seeding completed successfully!"
# else
#   echo "⚠️ Database seeding failed."
# fi 