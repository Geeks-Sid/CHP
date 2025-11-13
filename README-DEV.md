# Development Setup

This guide will help you start all services (database, backend, and frontend) for the Hospital Management System.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

## Quick Start

### Option 1: Using npm scripts (Recommended)

1. **Install dependencies** (first time only):
   ```bash
   npm run install:all
   ```

2. **Start all services**:
   ```bash
   npm run dev
   ```

   This will start:
   - Database services (PostgreSQL, Redis, MinIO) via Docker Compose
   - Backend server on http://localhost:3000
   - Frontend server on http://localhost:8080

3. **Stop services**:
   - Press `Ctrl+C` to stop all services
   - Database services will continue running in Docker. To stop them:
     ```bash
     npm run stop:db
     ```

### Option 2: Using shell scripts

**On Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**On Windows:**
```batch
start-dev.bat
```

### Option 3: Manual start

1. **Start database services**:
   ```bash
   cd database
   docker-compose up -d
   cd ..
   ```

2. **Start backend** (in a new terminal):
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Start frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start all services (database, backend, frontend)
- `npm run dev:db` - Start only database services
- `npm run dev:backend` - Start only backend server
- `npm run dev:frontend` - Start only frontend server
- `npm run dev:db:detached` - Start database services in detached mode
- `npm run stop:db` - Stop database services
- `npm run install:all` - Install dependencies for all projects
- `npm run build` - Build both backend and frontend for production
- `npm run clean` - Clean all build artifacts and node_modules

## Service URLs

Once all services are running:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Database**: localhost:5432
  - Database: `hospital`
  - User: `hospital`
  - Password: `password`
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001
  - Access Key: `minio`
  - Secret Key: `minio123`

## Troubleshooting

### Port already in use

If you get port conflicts:

- **Port 3000 (Backend)**: Change `PORT` in `backend/.env`
- **Port 8080 (Frontend)**: Change port in `frontend/vite.config.ts`
- **Port 5432 (PostgreSQL)**: Change port mapping in `database/docker-compose.yml`

### Database connection issues

1. Ensure Docker is running
2. Check if containers are up: `docker ps`
3. Check database logs: `cd database && docker-compose logs postgres`

### Backend won't start

1. Check if database is running: `docker ps | grep postgres`
2. Verify backend `.env` file exists and has correct database credentials
3. Check backend logs for specific errors

### Frontend won't connect to backend

1. Ensure backend is running on port 3000
2. Check browser console for CORS errors
3. Verify `frontend/src/lib/api-config.ts` has correct API URL

## Environment Variables

### Backend

Create `backend/.env` file (see `backend/.env.example` if available):

```env
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=hospital
PGUSER=hospital
PGPASSWORD=password
JWT_SECRET=your-secret-key-min-32-characters-long
```

### Frontend

Create `frontend/.env` file (optional, uses proxy by default):

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Development Workflow

1. Start all services: `npm run dev`
2. Make changes to code
3. Backend and frontend will auto-reload on file changes
4. Database changes require manual migration (see backend README)

## Stopping Services

- **All services**: Press `Ctrl+C` in the terminal running `npm run dev`
- **Database only**: `npm run stop:db` or `cd database && docker-compose down`
- **Individual services**: Stop the respective terminal/process

## Next Steps

- See `backend/README.md` for backend-specific documentation
- See `frontend/README.md` for frontend-specific documentation
- See `database/README.md` for database setup and migrations

