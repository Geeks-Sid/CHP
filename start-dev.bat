@echo off
setlocal enabledelayedexpansion

echo Starting Hospital Management System...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Warning: Docker is not running. Please start Docker first.
    exit /b 1
)

REM Start database services
echo Starting database services (PostgreSQL, Redis, MinIO)...
cd database
docker-compose up -d
cd ..

REM Wait for database to be ready
echo Waiting for database to be ready...
timeout /t 5 /nobreak >nul

REM Start backend
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run start:dev"
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo All services started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8080
echo Database: localhost:5432
echo Redis: localhost:6379
echo MinIO: http://localhost:9001
echo.
echo Close the command windows to stop the services.
echo To stop database services, run: cd database ^&^& docker-compose down

pause

