#!/bin/bash

# K-Fin Docker Build Script
# Builds production-ready Docker images with optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="k-fin"
TAG="${1:-latest}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(git describe --tags --always 2>/dev/null || echo "dev")

echo -e "${BLUE}🐳 K-Fin Docker Build Script${NC}"
echo -e "${BLUE}================================${NC}"
echo "Building image: ${IMAGE_NAME}:${TAG}"
echo "Build date: ${BUILD_DATE}"
echo "VCS ref: ${VCS_REF}"
echo "Version: ${VERSION}"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to build the image
build_image() {
    echo -e "${YELLOW}🔨 Building production image...${NC}"
    
    # Navigate to project root (3 levels up from scripts directory)
    cd "$(dirname "$0")/../../.."
    
    # Build the image
    docker build \
        --file plans/docker-setup/dockerfile-templates/Dockerfile \
        --tag "${IMAGE_NAME}:${TAG}" \
        --tag "${IMAGE_NAME}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --build-arg VERSION="${VERSION}" \
        --platform linux/amd64 \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully!${NC}"
    else
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
}

# Function to show image info
show_image_info() {
    echo -e "${BLUE}📊 Image Information:${NC}"
    echo "Size: $(docker images --format 'table {{.Size}}' ${IMAGE_NAME}:${TAG} | tail -n 1)"
    echo "Created: $(docker images --format 'table {{.CreatedAt}}' ${IMAGE_NAME}:${TAG} | tail -n 1)"
    echo ""
    
    echo -e "${BLUE}🏷️  Available tags:${NC}"
    docker images --filter reference="${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# Function to run security scan (if available)
security_scan() {
    if command -v docker-scout &> /dev/null; then
        echo -e "${YELLOW}🔍 Running security scan...${NC}"
        docker scout cves "${IMAGE_NAME}:${TAG}" || echo -e "${YELLOW}⚠️  Docker Scout not available or scan failed${NC}"
    elif command -v trivy &> /dev/null; then
        echo -e "${YELLOW}🔍 Running Trivy security scan...${NC}"
        trivy image "${IMAGE_NAME}:${TAG}" || echo -e "${YELLOW}⚠️  Trivy scan failed${NC}"
    else
        echo -e "${YELLOW}⚠️  No security scanning tools available. Consider installing Docker Scout or Trivy.${NC}"
    fi
}

# Function to clean up old images
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up dangling images...${NC}"
    docker image prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show usage
usage() {
    echo "Usage: $0 [TAG] [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --clean    Clean up after build"
    echo "  -s, --scan     Run security scan"
    echo "  -n, --no-push  Don't push to registry"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build with 'latest' tag"
    echo "  $0 v1.0.0            # Build with specific tag"
    echo "  $0 latest --clean    # Build and cleanup"
    echo "  $0 latest --scan     # Build and run security scan"
}

# Parse command line arguments
CLEAN=false
SCAN=false
NO_PUSH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -s|--scan)
            SCAN=true
            shift
            ;;
        -n|--no-push)
            NO_PUSH=true
            shift
            ;;
        -*)
            echo -e "${RED}Unknown option $1${NC}"
            usage
            exit 1
            ;;
        *)
            if [ -z "$TAG" ] || [ "$TAG" = "latest" ]; then
                TAG="$1"
            fi
            shift
            ;;
    esac
done

# Main execution
main() {
    check_docker
    build_image
    show_image_info
    
    if [ "$SCAN" = true ]; then
        security_scan
    fi
    
    if [ "$CLEAN" = true ]; then
        cleanup
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Build process completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "• Test the image: docker run --rm -p 3000:3000 ${IMAGE_NAME}:${TAG}"
    echo "• Run with compose: docker-compose -f plans/docker-setup/docker-compose/docker-compose.prod.yml up"
    echo "• Deploy to registry: docker push ${IMAGE_NAME}:${TAG}"
    echo ""
}

# Run main function
main "$@"