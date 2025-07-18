#!/bin/bash

# K-Fin Deployment Helper Script
# Assists with Docker-based deployments to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="k-fin"
REGISTRY="${REGISTRY:-}"
TAG="${TAG:-latest}"

echo -e "${BLUE}🚀 K-Fin Deployment Helper${NC}"
echo -e "${BLUE}=========================${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        exit 1
    fi
    
    # Check if image exists
    if ! docker image inspect "${IMAGE_NAME}:${TAG}" > /dev/null 2>&1; then
        echo -e "${RED}❌ Image ${IMAGE_NAME}:${TAG} not found. Build it first with: ./build.sh${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to deploy to Vercel (using Docker for build optimization)
deploy_vercel() {
    echo -e "${YELLOW}🔄 Deploying to Vercel...${NC}"
    
    # Navigate to project root
    cd "$(dirname "$0")/../../.."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
        exit 1
    fi
    
    # Build optimized for Vercel
    echo "Building for Vercel deployment..."
    
    # Use Docker to build (ensures consistent environment)
    docker run --rm \
        -v "$(pwd):/app" \
        -w /app \
        node:20-alpine \
        sh -c "
            npm ci &&
            cd packages/database && npx prisma generate && cd ../.. &&
            cd apps/web && npm run build
        "
    
    # Deploy to Vercel
    if [ "${1:-}" = "--production" ]; then
        echo "Deploying to production..."
        vercel --prod
    else
        echo "Deploying to preview..."
        vercel
    fi
    
    echo -e "${GREEN}✅ Vercel deployment completed${NC}"
}

# Function to push to container registry
push_to_registry() {
    if [ -z "$REGISTRY" ]; then
        echo -e "${RED}❌ No registry specified. Set REGISTRY environment variable${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Pushing to registry: ${REGISTRY}${NC}"
    
    # Tag for registry
    docker tag "${IMAGE_NAME}:${TAG}" "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    docker tag "${IMAGE_NAME}:${TAG}" "${REGISTRY}/${IMAGE_NAME}:latest"
    
    # Push to registry
    docker push "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
    
    echo -e "${GREEN}✅ Successfully pushed to registry${NC}"
}

# Function to deploy to production-like environment
deploy_production() {
    echo -e "${YELLOW}🔄 Deploying to production environment...${NC}"
    
    cd "$(dirname "$0")/../../.."
    
    # Use production compose file
    COMPOSE_FILE="plans/docker-setup/docker-compose/docker-compose.prod.yml"
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        echo -e "${RED}❌ Docker Compose not available${NC}"
        exit 1
    fi
    
    # Stop existing production containers
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} down
    
    # Start production environment
    ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} up -d
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    if docker run --rm --network k-fin-prod-network alpine/curl \
        curl -f http://app:3000/api/health; then
        echo -e "${GREEN}✅ Production deployment successful${NC}"
    else
        echo -e "${RED}❌ Production deployment failed health check${NC}"
        ${DOCKER_COMPOSE} -f ${COMPOSE_FILE} logs
        exit 1
    fi
}

# Function to deploy to staging
deploy_staging() {
    echo -e "${YELLOW}🔄 Deploying to staging environment...${NC}"
    
    # Similar to production but with staging configuration
    export DATABASE_URL="${STAGING_DATABASE_URL:-postgresql://postgres:postgres@database:5432/k_fin_staging}"
    export BETTER_AUTH_URL="${STAGING_URL:-http://staging.k-fin.com}"
    
    deploy_production
    
    echo -e "${GREEN}✅ Staging deployment completed${NC}"
}

# Function to rollback deployment
rollback() {
    local previous_tag="${1:-previous}"
    echo -e "${YELLOW}🔄 Rolling back to ${previous_tag}...${NC}"
    
    if [ "$DEPLOYMENT_TARGET" = "vercel" ]; then
        # Vercel rollback
        vercel rollback
    else
        # Docker rollback
        cd "$(dirname "$0")/../../.."
        COMPOSE_FILE="plans/docker-setup/docker-compose/docker-compose.prod.yml"
        
        # Stop current deployment
        docker-compose -f ${COMPOSE_FILE} down
        
        # Deploy previous version
        TAG="$previous_tag" docker-compose -f ${COMPOSE_FILE} up -d
    fi
    
    echo -e "${GREEN}✅ Rollback completed${NC}"
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"
    
    cd "$(dirname "$0")/../../.."
    
    # Run tests in container
    echo "Running tests..."
    docker run --rm \
        -v "$(pwd):/app" \
        -w /app \
        "${IMAGE_NAME}:${TAG}" \
        sh -c "npm run test:coverage"
    
    # Security scan
    if command -v trivy &> /dev/null; then
        echo "Running security scan..."
        trivy image "${IMAGE_NAME}:${TAG}"
    fi
    
    # Check environment variables
    echo "Checking required environment variables..."
    required_vars=("DATABASE_URL" "BETTER_AUTH_SECRET" "RESEND_API_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            echo -e "${RED}❌ Required environment variable $var is not set${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    
    # Show running containers
    echo -e "${YELLOW}Running containers:${NC}"
    docker ps --filter name=k-fin
    
    # Show images
    echo -e "${YELLOW}Available images:${NC}"
    docker images --filter reference=k-fin
    
    # If Vercel CLI is available, show Vercel deployments
    if command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel deployments:${NC}"
        vercel ls
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  vercel [--production]  Deploy to Vercel (preview or production)"
    echo "  registry              Push to container registry"
    echo "  production            Deploy to production environment"
    echo "  staging               Deploy to staging environment"
    echo "  rollback [tag]        Rollback to previous deployment"
    echo "  status                Show deployment status"
    echo "  check                 Run pre-deployment checks"
    echo "  help                  Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  REGISTRY              Container registry URL"
    echo "  TAG                   Image tag (default: latest)"
    echo "  STAGING_DATABASE_URL  Staging database URL"
    echo "  STAGING_URL           Staging application URL"
    echo ""
    echo "Examples:"
    echo "  $0 vercel             # Deploy preview to Vercel"
    echo "  $0 vercel --production # Deploy to Vercel production"
    echo "  REGISTRY=docker.io/myorg $0 registry # Push to Docker Hub"
    echo "  $0 production         # Deploy to production environment"
    echo "  $0 rollback v1.0.0    # Rollback to specific version"
}

# Parse command line arguments
COMMAND="${1:-help}"
shift || true

# Main execution
main() {
    case $COMMAND in
        vercel)
            check_prerequisites
            pre_deployment_checks
            deploy_vercel "$@"
            ;;
        registry)
            check_prerequisites
            push_to_registry
            ;;
        production)
            check_prerequisites
            pre_deployment_checks
            deploy_production
            ;;
        staging)
            check_prerequisites
            pre_deployment_checks
            deploy_staging
            ;;
        rollback)
            rollback "$1"
            ;;
        status)
            show_status
            ;;
        check)
            check_prerequisites
            pre_deployment_checks
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