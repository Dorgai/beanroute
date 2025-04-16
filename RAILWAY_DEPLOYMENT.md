# Railway Database Deployment Guide

This guide will help you deploy the database schema to Railway.

## Method 1: Using Railway Dashboard

1. Log in to your Railway account at [
   railway.app](https://railway.app/)
2. Select your project
3. Find your PostgreSQL database service
4. Click on the "Data" tab
5. Click on "SQL Editor"
6. Copy the entire contents of the `railway-migration.sql` file in this repository
7. Paste it into the SQL Editor
8. Click "Run" to execute the script

This will:
- Create all necessary database tables
- Set up relationships between them
- Create an initial admin user (username: admin, password: secret)
- Mark the migration as complete in Prisma's migration table

## Method 2: Using Railway CLI

If you prefer using the CLI:

1. Make sure you've installed the Railway CLI:
   ```
   npm install -g @railway/cli
   ```

2. Log in to Railway:
   ```
   railway login
   ```

3. Link to your project:
   ```
   railway link
   ```

4. Connect to the PostgreSQL service and execute the SQL script:
   ```
   cat railway-migration.sql | railway run "psql \$DATABASE_URL"
   ```

## After Migration

After running the migration, you'll need to make sure your application environment has the correct access to the database:

1. Make sure `DATABASE_URL` and `DIRECT_DATABASE_URL` are properly configured in Railway
2. Verify the connection with:
   ```
   railway run "npx prisma db pull"
   ```

## Troubleshooting

If you encounter errors:

1. Check the Railway logs for your database service
2. Verify that the database user has the necessary permissions
3. Try running each section of the SQL script separately if there are specific errors

For local development, remember to use:
```
./start-local.sh
``` 