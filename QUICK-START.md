# Quick Start Guide

## 🚀 Start Everything with One Command

### First Time Setup

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Install all project dependencies**:
   ```bash
   npm run install:all
   ```

### Start All Services

Simply run:
```bash
npm run dev
```

This will start:
- ✅ Database (PostgreSQL, Redis, MinIO) via Docker
- ✅ Backend API on http://localhost:3000
- ✅ Frontend on http://localhost:8080

### Stop Services

Press `Ctrl+C` to stop all services.

To stop database services separately:
```bash
npm run stop:db
```

## 📋 Alternative Methods

### Windows
```batch
start-dev.bat
```

### Linux/Mac
```bash
./start-dev.sh
```

## 🔗 Service URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **MinIO Console**: http://localhost:9001

## ⚠️ Prerequisites

- Node.js 18+
- Docker Desktop (for database services)
- npm 9+

## 🐛 Troubleshooting

**Port conflicts?** Check if ports 3000, 8080, or 5432 are already in use.

**Docker not running?** Start Docker Desktop first.

**Database connection errors?** Wait a few seconds after starting - database needs time to initialize.

