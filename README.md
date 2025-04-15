# BeanRoute

A specialty coffee management system for coffee shops and roasters to manage inventory, users, and activities.

## Features

- User management with role-based access control
- Coffee inventory tracking and management
- Shop and team organization
- Activity monitoring and logging
- Responsive UI for all devices

## Local Development

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Setup the local database:

```bash
./setup-local-db.sh
```

4. Start the development server:

```bash
./start-dev.sh
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default User Accounts

- Admin: username: `admin`, password: `admin123`
- Owner: username: `owner`, password: `owner123`
- Retailer: username: `retailer`, password: `retailer123`
- Roaster: username: `roaster`, password: `roaster123`
- Barista: username: `barista`, password: `barista123`

## Railway Deployment Instructions

This application is configured for easy deployment to Railway.

### Prerequisites

1. A Railway account
2. Railway CLI installed (optional, for local deployments)

### Deployment Steps

1. Create a new project in Railway
2. Add a PostgreSQL database service
3. Add a web service connected to your GitHub repository
4. Set the following environment variables in the web service:

```
DATABASE_URL=postgresql://railway:password@hostname:port/railway
JWT_SECRET=your-secure-random-string
NODE_ENV=production
SEED_DATABASE=true  # Set to 'true' only for initial deployment
```

5. Deploy the application

### Database Migrations

Database migrations are automatically applied during deployment through the `deploy-db.sh` script called from the `docker-entrypoint.sh` script. For manual migrations:

```bash
# For local use
export DATABASE_URL=your-railway-db-url
./deploy-railway-db.sh
```

### Health Checks

The application provides a health check endpoint at `/api/health` which Railway uses to verify successful deployment.

## License

[MIT](LICENSE) 