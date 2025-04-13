# User Management System

A complete user management, authentication, and access rights management system with a beautiful UI.

## Features

- User authentication with JWT tokens
- Role-based access control
- User management (create, update, delete users)
- Team management for organizing users
- Permission management for fine-grained access control
- Audit trail for user activities
- Session management

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt for password hashing
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd user-management-system
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` and `JWT_SECRET` in the `.env` file.

4. Set up the database:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npx prisma db seed
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users

After seeding the database, the following users will be available:

- Admin User:
  - Username: `admin`
  - Password: `admin123`
  - Role: `ADMIN`

- Manager User:
  - Username: `manager`
  - Password: `manager123`
  - Role: `MANAGER`

- Regular User:
  - Username: `user`
  - Password: `user123`
  - Role: `USER`

## Deployment to Railway

1. Create a new project in Railway
2. Add a PostgreSQL database to your project
3. Connect your GitHub repository
4. Configure environment variables in Railway:
   - `DATABASE_URL` (provided by Railway PostgreSQL plugin)
   - `DIRECT_DATABASE_URL` (provided by Railway PostgreSQL plugin)
   - `JWT_SECRET` (generate a strong secret key)
   - `NODE_ENV=production`
5. Deploy the application

## License

This project is licensed under the MIT License - see the LICENSE file for details. 