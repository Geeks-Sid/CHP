# Quick Start - Linux

## 🚀 One Command to Start Everything

```bash
./dev.sh start
```

That's it! This starts:
- ✅ PostgreSQL database
- ✅ Redis cache  
- ✅ MinIO storage
- ✅ Backend API (port 3000)
- ✅ Frontend app (port 8080)

## 📋 Common Commands

```bash
./dev.sh start          # Start all services
./dev.sh stop           # Stop all services
./dev.sh logs           # View all logs
./dev.sh logs backend   # View backend logs only
./dev.sh status         # Check service status
./dev.sh restart backend  # Restart backend
```

## 🔗 Access URLs

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **MinIO**: http://localhost:9001

## 🛠️ First Time Setup

```bash
# Make script executable
chmod +x dev.sh

# (Optional) Copy environment file
cp .env.example .env

# Start everything
./dev.sh start
```

## 🐛 Troubleshooting

**Port in use?** Edit `.env` to change ports

**Services won't start?** 
```bash
./dev.sh logs          # Check logs
./dev.sh build         # Rebuild images
```

**Clean start?**
```bash
./dev.sh clean         # Removes everything
./dev.sh start         # Start fresh
```

## 📖 Full Documentation

See `README-DOCKER.md` for complete documentation.

