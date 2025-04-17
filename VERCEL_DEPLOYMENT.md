# Vercel Deployment Guide

This guide will help you deploy the BeanRoute application to Vercel and set up the required database.

## Prerequisites

- Vercel account
- Node.js installed locally

## Deployment Steps

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set up PostgreSQL in Vercel**:
   - Go to the Vercel Dashboard
   - Select your project
   - Navigate to "Storage" tab
   - Click "Connect Database" and select "PostgreSQL"
   - Follow the setup wizard

3. **Set Required Environment Variables**:
   - Go to Settings > Environment Variables
   - Add the following variables:
     ```
     DATABASE_URL: <The PostgreSQL connection string provided by Vercel>
     POSTGRES_PRISMA_URL: <The same connection string>
     JWT_SECRET: "beanroute-secure-production-fd73d7f0e3530f4fdf72e4c0513cee9b"
     NODE_ENV: "production"
     SEED_DATABASE: "false"
     COOKIE_SECURE: "true"
     COOKIE_SAMESITE: "lax"
     ```

4. **Set up the Database Schema**:
   - Copy the PostgreSQL connection string from Vercel
   - Run the database setup script:
     ```bash
     node vercel-db-setup.js
     ```
   - Paste the connection string when prompted
   - Follow the prompts to set up the database and seed it with initial data

5. **Redeploy the Application**:
   ```bash
   vercel --prod
   ```

## Troubleshooting

If you encounter an "Internal server error" at login, check:

1. Database connectivity: Ensure the database is properly set up and the connection URL is correct
2. Environment variables: Verify all required environment variables are set
3. Logs: Check the Vercel logs for any specific error messages
4. Migration status: Make sure your database migrations have been applied correctly

## Login Credentials

After setting up the initial seed data, you can login with:

- Username: `admin`
- Password: `admin123` 