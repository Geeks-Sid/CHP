#!/bin/bash

# Hospital Management System - Development Script
# This script manages the development environment using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
COMPOSE_PROD_FILE="docker-compose.yml"

# Functions
print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if compose command exists (newer Docker versions)
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# Start all services
start_services() {
    print_header "Starting Hospital Management System"
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    print_info "Starting database services..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d postgres redis minio
    
    print_info "Waiting for database to be ready..."
    sleep 5
    
    print_info "Starting backend and frontend..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d backend frontend
    
    print_success "All services started!"
    echo ""
    print_info "Service URLs:"
    echo -e "  ${GREEN}Frontend:${NC}    http://localhost:${FRONTEND_PORT:-8080}"
    echo -e "  ${GREEN}Backend:${NC}     http://localhost:${BACKEND_PORT:-3000}"
    echo -e "  ${GREEN}API Docs:${NC}    http://localhost:${BACKEND_PORT:-3000}/api/docs"
    echo -e "  ${GREEN}MinIO Console:${NC} http://localhost:${MINIO_CONSOLE_PORT:-9001}"
    echo ""
    print_info "View logs with: ./dev.sh logs"
    print_info "Stop services with: ./dev.sh stop"
}

# Stop all services
stop_services() {
    print_header "Stopping Hospital Management System"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE down
    
    print_success "All services stopped"
}

# Stop and remove volumes (clean slate)
clean_services() {
    print_header "Cleaning Hospital Management System"
    
    print_warning "This will remove all data including the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelled"
        exit 0
    fi
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE down -v
    
    print_success "All services and volumes removed"
}

# Show logs
show_logs() {
    COMPOSE_CMD=$(get_compose_cmd)
    
    if [ -z "$1" ]; then
        print_header "Showing logs for all services"
        $COMPOSE_CMD -f $COMPOSE_FILE logs -f
    else
        print_header "Showing logs for: $1"
        $COMPOSE_CMD -f $COMPOSE_FILE logs -f "$1"
    fi
}

# Restart a service
restart_service() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name"
        echo "Available services: postgres, redis, minio, backend, frontend"
        exit 1
    fi
    
    print_header "Restarting service: $1"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE restart "$1"
    
    print_success "Service $1 restarted"
}

# Build services
build_services() {
    print_header "Building Docker images"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE build
    
    print_success "All images built"
}

# Show status
show_status() {
    print_header "Service Status"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE ps
    
    echo ""
    print_info "Service URLs:"
    echo -e "  ${GREEN}Frontend:${NC}    http://localhost:${FRONTEND_PORT:-8080}"
    echo -e "  ${GREEN}Backend:${NC}     http://localhost:${BACKEND_PORT:-3000}"
    echo -e "  ${GREEN}API Docs:${NC}    http://localhost:${BACKEND_PORT:-3000}/api/docs"
    echo -e "  ${GREEN}MinIO Console:${NC} http://localhost:${MINIO_CONSOLE_PORT:-9001}"
}

# Install dependencies (for local development without Docker)
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ -d "backend" ]; then
        print_info "Installing backend dependencies..."
        cd backend && npm install && cd ..
        print_success "Backend dependencies installed"
    fi
    
    if [ -d "frontend" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
        print_success "Frontend dependencies installed"
    fi
    
    print_success "All dependencies installed"
}

# Database only (for local development)
start_database_only() {
    print_header "Starting Database Services Only"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_PROD_FILE up -d
    
    print_success "Database services started"
    print_info "PostgreSQL: localhost:${POSTGRES_PORT:-5432}"
    print_info "Redis: localhost:${REDIS_PORT:-6379}"
    print_info "MinIO: http://localhost:${MINIO_CONSOLE_PORT:-9001}"
}

# Stop database only
stop_database_only() {
    print_header "Stopping Database Services"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_PROD_FILE down
    
    print_success "Database services stopped"
}

# Show help
show_help() {
    echo "Hospital Management System - Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services (database, backend, frontend)"
    echo "  stop            Stop all services"
    echo "  restart [svc]   Restart a specific service"
    echo "  logs [svc]      Show logs (all services or specific service)"
    echo "  status          Show service status"
    echo "  build           Build Docker images"
    echo "  clean           Stop and remove all containers and volumes"
    echo "  db:start        Start database services only"
    echo "  db:stop         Stop database services only"
    echo "  install         Install npm dependencies locally"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh start              # Start everything"
    echo "  ./dev.sh logs backend       # Show backend logs"
    echo "  ./dev.sh restart frontend   # Restart frontend service"
    echo ""
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_service "$2"
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        build)
            build_services
            ;;
        clean)
            clean_services
            ;;
        db:start)
            start_database_only
            ;;
        db:stop)
            stop_database_only
            ;;
        install)
            install_dependencies
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

