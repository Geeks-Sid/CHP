#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Hospital Management System...${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start database services
echo -e "${GREEN}Starting database services (PostgreSQL, Redis, MinIO)...${NC}"
cd database
docker-compose up -d
cd ..

# Wait for database to be ready
echo -e "${BLUE}Waiting for database to be ready...${NC}"
sleep 5

# Start backend
echo -e "${GREEN}Starting backend server...${NC}"
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}All services started!${NC}"
echo -e "${BLUE}Backend: http://localhost:3000${NC}"
echo -e "${BLUE}Frontend: http://localhost:8080${NC}"
echo -e "${BLUE}Database: localhost:5432${NC}"
echo -e "${BLUE}Redis: localhost:6379${NC}"
echo -e "${BLUE}MinIO: http://localhost:9001${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user interrupt
trap "echo ''; echo -e '${YELLOW}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cd database && docker-compose down && cd ..; exit" INT TERM

wait

