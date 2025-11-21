# Authentication Setup Guide

This guide explains how to set up authentication with password verification in a local database.

## Prerequisites

1. **Docker Desktop** must be installed and running
2. **Node.js** and npm installed
3. Backend dependencies installed: `cd backend && npm install`

## Step 1: Start the Database

The database runs in Docker. Start it with:

```bash
cd database
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on ports 9000 and 9001

Wait for the database to be ready (about 10-15 seconds).

## Step 2: Run Database Migrations

The migrations will automatically run when the database container is first created (they're mounted in `/docker-entrypoint-initdb.d`).

However, if you need to run migrations manually or apply new migrations:

```bash
cd backend
npm run migrate:dev
```

This will:
- Apply all migrations from `database/migrations/`
- Create demo users with hashed passwords
- Set up roles and permissions

## Step 3: Verify Database Setup

You can verify the database is set up correctly by checking if users exist:

```bash
# Connect to the database
docker exec -it hospital-postgres psql -U hospital -d hospital

# Check users
SELECT username, email FROM users;

# Check roles
SELECT role_name FROM roles;

# Exit
\q
```

## Step 4: Start the Backend

```bash
cd backend
npm run start:dev
```

The backend will start on `http://localhost:3000`.

## Step 5: Test Authentication

### Demo Users

The following demo users are available (all use password: `Password123!`):

| Username | Email | Role |
|----------|-------|------|
| `patient@example.com` | patient@example.com | Patient |
| `receptionist@example.com` | receptionist@example.com | Receptionist |
| `clinician@example.com` | clinician@example.com | Doctor |
| `pharmacy@example.com` | pharmacy@example.com | Pharmacist |
| `warehouse@example.com` | warehouse@example.com | Warehouse Manager |

### Test Login via Frontend

1. Start the frontend: `cd frontend && npm run dev`
2. Navigate to the login page
3. Click on any demo account button to autofill credentials
4. Click "Sign In"

### Test Login via API

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient@example.com",
    "password": "Password123!"
  }'
```

You should receive a response with `accessToken` and `refreshToken`.

## Password Security

- **Password Hashing**: All passwords are hashed using bcrypt with 12 rounds
- **No Plaintext Storage**: Passwords are never stored in plaintext
- **Constant-Time Comparison**: Password verification uses constant-time comparison to prevent timing attacks
- **Account Lockout**: After 5 failed login attempts, accounts are locked for 15 minutes

## Troubleshooting

### Database Connection Issues

1. Check if Docker is running: `docker ps`
2. Check if the database container is up: `docker ps | grep postgres`
3. Check database logs: `docker logs hospital-postgres`

### Migration Issues

If migrations fail:
1. Check database connection settings in `backend/.env` (or environment variables)
2. Ensure the database is running: `docker-compose ps` in the `database` directory
3. Manually check migration status in the database:
   ```sql
   SELECT * FROM schema_migrations;
   ```

### Authentication Issues

1. Verify users exist: `SELECT username FROM users;`
2. Check password hash format: `SELECT username, LEFT(password_hash, 20) FROM users;`
3. Check user roles: `SELECT u.username, r.role_name FROM users u JOIN user_roles ur ON u.user_id = ur.user_id JOIN roles r ON ur.role_id = r.role_id;`

## Environment Variables

Create `backend/.env` file with:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=hospital
PGUSER=hospital
PGPASSWORD=password
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
PORT=3000
NODE_ENV=development
```

## Files Created/Modified

- `database/migrations/V020__seed_demo_users.sql` - Demo users seed migration
- `backend/scripts/migrate.js` - Migration runner script
- `backend/scripts/generate-password-hash.js` - Password hash generator utility
- `frontend/src/components/auth/LoginForm.tsx` - Updated with correct demo passwords

## Next Steps

After authentication is working:
1. Test all demo user roles
2. Verify JWT tokens are being generated correctly
3. Test token refresh functionality
4. Test logout functionality

