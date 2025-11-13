# Docker Development Setup

This guide explains how to run the Hospital Management System using Docker Compose on Linux.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (or docker-compose 1.29+)
- Git
- At least 4GB RAM available for Docker

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd CHP

# Make the script executable
chmod +x dev.sh

# Copy environment file (optional, defaults are fine for dev)
cp .env.example .env
```

### 2. Start All Services

```bash
./dev.sh start
```

This will start:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ MinIO object storage
- ✅ Backend API server
- ✅ Frontend development server

### 3. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **MinIO Console**: http://localhost:9001

## Available Commands

### Basic Commands

```bash
./dev.sh start          # Start all services
./dev.sh stop           # Stop all services
./dev.sh status         # Show service status
./dev.sh logs           # Show logs for all services
./dev.sh logs backend   # Show logs for specific service
```

### Service Management

```bash
./dev.sh restart backend   # Restart backend service
./dev.sh restart frontend   # Restart frontend service
./dev.sh build             # Rebuild Docker images
```

### Database Only

```bash
./dev.sh db:start    # Start only database services
./dev.sh db:stop     # Stop only database services
```

### Maintenance

```bash
./dev.sh clean       # Stop and remove all containers and volumes (WARNING: deletes data!)
./dev.sh install     # Install npm dependencies locally (for IDE support)
```

## Service Details

### Database Services

- **PostgreSQL**: Port 5432
  - Database: `hospital`
  - User: `hospital`
  - Password: `password`
  
- **Redis**: Port 6379
  - Used for caching and sessions

- **MinIO**: Ports 9000 (API), 9001 (Console)
  - Access Key: `minio`
  - Secret Key: `minio123`
  - Used for document storage

### Application Services

- **Backend**: Port 3000
  - NestJS application
  - Auto-reloads on code changes
  - Health check: http://localhost:3000/api/v1/health

- **Frontend**: Port 8080
  - Vite development server
  - Auto-reloads on code changes
  - Hot module replacement enabled

## Development Workflow

### 1. Start Services

```bash
./dev.sh start
```

### 2. View Logs

```bash
# All services
./dev.sh logs

# Specific service
./dev.sh logs backend
./dev.sh logs frontend
```

### 3. Make Code Changes

- Edit files in `backend/` or `frontend/`
- Changes are automatically detected and services reload
- No need to restart containers

### 4. Stop Services

```bash
./dev.sh stop
```

## Environment Variables

Create a `.env` file in the root directory to customize settings:

```bash
cp .env.example .env
```

Edit `.env` to change:
- Database credentials
- Port numbers
- JWT secret
- Other configuration

## Troubleshooting

### Port Already in Use

If you get port conflicts, edit `.env` or `docker-compose.dev.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port
```

### Services Won't Start

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check logs:
   ```bash
   ./dev.sh logs
   ```

3. Rebuild images:
   ```bash
   ./dev.sh build
   ```

### Database Connection Issues

1. Wait for database to be ready (first start takes ~30 seconds)
2. Check database logs:
   ```bash
   ./dev.sh logs postgres
   ```

3. Verify database is healthy:
   ```bash
   docker exec hospital-postgres pg_isready -U hospital
   ```

### Out of Memory

If containers keep restarting:

1. Increase Docker memory limit (Docker Desktop → Settings → Resources)
2. Or reduce services:
   ```bash
   ./dev.sh db:start  # Only database
   # Then run backend/frontend locally
   ```

### Clean Start

If something is broken, start fresh:

```bash
./dev.sh clean    # Removes everything
./dev.sh start    # Start fresh
```

## File Structure

```
.
├── docker-compose.dev.yml    # Development compose file
├── docker-compose.yml        # Production compose file (database only)
├── dev.sh                    # Management script
├── .env.example              # Environment variables template
├── backend/
│   ├── Dockerfile.dev        # Backend dev Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile.dev        # Frontend dev Dockerfile
│   └── ...
└── database/
    └── migrations/           # Database migrations
```

## Production Deployment

For production, use the production Dockerfile and compose file:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Tips

1. **View logs in real-time**: `./dev.sh logs -f`
2. **Restart after config changes**: `./dev.sh restart backend`
3. **Check service health**: `./dev.sh status`
4. **Access database directly**: 
   ```bash
   docker exec -it hospital-postgres psql -U hospital -d hospital
   ```

## Support

For issues or questions:
1. Check logs: `./dev.sh logs`
2. Check status: `./dev.sh status`
3. Review this documentation
4. Check Docker and Docker Compose versions

