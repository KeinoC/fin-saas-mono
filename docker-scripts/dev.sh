#!/bin/bash

# K-Fin Development Environment Script
# Sets up and manages the development Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="k-fin"

echo -e "${BLUE}🚀 K-Fin Development Environment${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if docker-compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose is available: ${DOCKER_COMPOSE}${NC}"
}

# Function to check for .env file
check_env_file() {
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️  .env.local file not found. Creating template...${NC}"
        cat > .env.local << EOF
# K-Fin Development Environment Variables
# Copy from .env.example and customize

# Database (automatically set for Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/k_fin_dev
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/k_fin_dev

# Authentication
BETTER_AUTH_SECRET=dev-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend) - Add your API key
RESEND_API_KEY=
EMAIL_FROM=K-Fin <dev@localhost>

# Google OAuth (optional) - Add your credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Development settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
        echo -e "${GREEN}✅ Template .env.local created. Please update with your values.${NC}"
    else
        echo -e "${GREEN}✅ .env.local file found${NC}"
    fi
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 10
    
    # Run Prisma migrations
    echo "Running Prisma migrations..."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec app sh -c "cd packages/database && npx prisma migrate dev --name init" || true
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec app sh -c "cd packages/database && npx prisma generate"
    
    # Seed database (optional)
    echo "Seeding database..."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec app npm run db:seed || echo "Seeding failed or not configured"
    
    # Create development user
    echo "Creating development user..."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec app npm run dev:create-user || echo "Dev user creation failed or user already exists"
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
}

# Function to start development environment
start_dev() {
    echo -e "${YELLOW}🔄 Starting development environment...${NC}"
    
    # Navigate to project root
    cd "$(dirname "$0")/../../.."
    
    # Pull latest images
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} pull
    
    # Build and start services
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} up -d --build
    
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo ""
    echo -e "${BLUE}📋 Service Status:${NC}"
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} ps
    
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "• Application: http://localhost:3000"
    echo "• Database Admin: http://localhost:8080 (run with --tools profile)"
    echo "• PostgreSQL: localhost:5432"
    echo "• Redis: localhost:6379"
    
    echo ""
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo "• View logs: ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} logs -f app"
    echo "• Shell access: ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec app sh"
    echo "• Stop services: ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} down"
    echo "• Restart app: ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} restart app"
}

# Function to stop development environment
stop_dev() {
    echo -e "${YELLOW}🛑 Stopping development environment...${NC}"
    cd "$(dirname "$0")/../../.."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} down
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

# Function to show logs
show_logs() {
    cd "$(dirname "$0")/../../.."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} logs -f "${1:-app}"
}

# Function to restart service
restart_service() {
    cd "$(dirname "$0")/../../.."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} restart "${1:-app}"
    echo -e "${GREEN}✅ Service ${1:-app} restarted${NC}"
}

# Function to run shell in container
run_shell() {
    cd "$(dirname "$0")/../../.."
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} exec "${1:-app}" sh
}

# Function to clean up
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up development environment...${NC}"
    cd "$(dirname "$0")/../../.."
    
    # Stop and remove containers
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} down -v
    
    # Remove unused volumes and networks
    docker volume prune -f
    docker network prune -f
    
    # Remove development images
    docker image prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show status
show_status() {
    cd "$(dirname "$0")/../../.."
    echo -e "${BLUE}📊 Development Environment Status:${NC}"
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} ps
    
    echo ""
    echo -e "${BLUE}💾 Volume Usage:${NC}"
    docker volume ls --filter name=k-fin
    
    echo ""
    echo -e "${BLUE}🌐 Network Information:${NC}"
    docker network ls --filter name=k-fin
}

# Function to show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start, up          Start the development environment"
    echo "  stop, down         Stop the development environment"
    echo "  restart [service]  Restart a service (default: app)"
    echo "  logs [service]     Show logs for a service (default: app)"
    echo "  shell [service]    Open shell in service container (default: app)"
    echo "  status             Show status of all services"
    echo "  setup-db           Setup and seed the database"
    echo "  cleanup            Clean up containers, volumes, and images"
    echo "  help               Show this help message"
    echo ""
    echo "Options:"
    echo "  --tools            Include additional tools (adminer, etc.)"
    echo "  --proxy            Include nginx reverse proxy"
    echo ""
    echo "Examples:"
    echo "  $0 start           # Start development environment"
    echo "  $0 logs app        # Show application logs"
    echo "  $0 shell database  # Open shell in database container"
    echo "  $0 restart         # Restart application service"
}

# Parse command line arguments
COMMAND="${1:-start}"
shift || true

PROFILES=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --tools)
            PROFILES="${PROFILES},tools"
            shift
            ;;
        --proxy)
            PROFILES="${PROFILES},proxy"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

# Add profiles to compose command if specified
if [ -n "$PROFILES" ]; then
    DOCKER_COMPOSE="${DOCKER_COMPOSE} --profile ${PROFILES#,}"
fi

# Main execution
main() {
    case $COMMAND in
        start|up)
            check_docker
            check_docker_compose
            check_env_file
            start_dev
            ;;
        stop|down)
            check_docker
            check_docker_compose
            stop_dev
            ;;
        restart)
            check_docker
            check_docker_compose
            restart_service "$SERVICE"
            ;;
        logs)
            check_docker
            check_docker_compose
            show_logs "$SERVICE"
            ;;
        shell)
            check_docker
            check_docker_compose
            run_shell "$SERVICE"
            ;;
        status)
            check_docker
            check_docker_compose
            show_status
            ;;
        setup-db)
            check_docker
            check_docker_compose
            setup_database
            ;;
        cleanup)
            check_docker
            check_docker_compose
            cleanup
            ;;
        help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown command: $COMMAND${NC}"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"