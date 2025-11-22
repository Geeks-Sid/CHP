# How to Run Frontend, Backend, and Databases Together

## Quick Start (Recommended)

Run everything with a single command:

```bash
npm run dev
```

This will start:
- ✅ **Database services** (PostgreSQL, Redis, MinIO) via Docker
- ✅ **Backend server** on http://localhost:3000
- ✅ **Frontend server** on http://localhost:8080

All services run in the same terminal with color-coded output.

## Step-by-Step Instructions

### 1. Ensure Docker is Running

Make sure Docker Desktop is running on your machine.

### 2. Start All Services

From the project root directory:

```bash
npm run dev
```

You'll see output from all three services:
- **DB** (blue) - Database services
- **BACKEND** (green) - Backend API server
- **FRONTEND** (yellow) - Frontend development server

### 3. Wait for Services to Start

- **Databases**: ~10-15 seconds to be ready
- **Backend**: ~10-20 seconds to compile and start
- **Frontend**: ~5-10 seconds to start

### 4. Access the Application

Once all services are running:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/v1/health
- **MinIO Console**: http://localhost:9001

## Alternative: Start Services Separately

If you prefer to run services in separate terminals:

### Terminal 1 - Databases:
```bash
npm run dev:db:detached
```

### Terminal 2 - Backend:
```bash
npm run dev:backend
```

### Terminal 3 - Frontend:
```bash
npm run dev:frontend
```

## Stopping Services

### Stop All Services:
- Press `Ctrl+C` in the terminal running `npm run dev`

### Stop Only Databases:
```bash
npm run stop:db
```

## Troubleshooting

### Port Already in Use

If you get port conflicts:

- **Port 3000 (Backend)**: Kill existing backend processes or change `PORT` in `backend/.env`
- **Port 8080 (Frontend)**: Kill existing frontend processes or change port in `frontend/vite.config.ts`
- **Port 5432 (PostgreSQL)**: Stop other PostgreSQL instances or change port in `database/docker-compose.yml`

### Database Not Ready

If backend can't connect to database:

1. Check Docker is running: `docker ps`
2. Wait a bit longer (databases need time to initialize)
3. Check database logs: `cd database && docker compose logs postgres`

### Backend Won't Start

1. Check if database is running: `docker ps | grep postgres`
2. Verify backend `.env` file exists with correct credentials
3. Check backend logs for specific errors

### Frontend Can't Connect to Backend

1. Ensure backend is running on port 3000
2. Check browser console for errors
3. Verify backend health: `curl http://localhost:3000/api/v1/health`

## Demo Users

All users have password: `Password123!`

- `patient@example.com` - Patient role
- `receptionist@example.com` - Receptionist role
- `clinician@example.com` - Doctor role
- `pharmacy@example.com` - Pharmacist role
- `warehouse@example.com` - Warehouse Manager role
- `admin@example.org` - Admin role

## Service URLs Summary

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | - |
| Backend API | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | hospital/password |
| Redis | localhost:6379 | - |
| MinIO Console | http://localhost:9001 | minio/minio123 |

## First Time Setup

If this is your first time running the project:

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run health check** (optional but recommended):
   ```bash
   npm run healthcheck
   ```

3. **Start all services**:
   ```bash
   npm run dev
   ```

That's it! Your Hospital Management System should now be running with all services connected and ready to use.

