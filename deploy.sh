#!/bin/bash

# Docker Hub Deployment Script
# Usage: ./deploy.sh [DOCKER_USERNAME] [TAG]
# Example: ./deploy.sh myusername latest

set -e

DOCKER_USERNAME="${1:-your-dockerhub-username}"
TAG="${2:-latest}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_IMAGE="$DOCKER_USERNAME/spring-mini-backend:$TAG"
FRONTEND_IMAGE="$DOCKER_USERNAME/spring-mini-frontend:$TAG"

print_help() {
    echo -e "${BLUE}Docker Hub Deployment Script${NC}"
    echo ""
    echo "Usage: ./deploy.sh [DOCKER_USERNAME] [TAG]"
    echo ""
    echo "Arguments:"
    echo "  DOCKER_USERNAME  Your Docker Hub username"
    echo "  TAG              Image tag (default: latest)"
    echo ""
    echo "Example:"
    echo "  ./deploy.sh myusername latest"
    echo "  ./deploy.sh myusername v1.0.0"
}

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    print_help
    exit 0
fi

if [ "$DOCKER_USERNAME" == "your-dockerhub-username" ]; then
    echo -e "${RED}Error: Please provide your Docker Hub username${NC}"
    echo ""
    print_help
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Docker Hub Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Backend Image:  ${YELLOW}$BACKEND_IMAGE${NC}"
echo -e "Frontend Image: ${YELLOW}$FRONTEND_IMAGE${NC}"
echo ""

# Login to Docker Hub
echo -e "${YELLOW}[1/5] Logging in to Docker Hub...${NC}"
docker login

# Build backend
echo -e "${YELLOW}[2/5] Building backend image...${NC}"
docker build -t "$BACKEND_IMAGE" ./backend

# Build frontend (with production API URL - will be overridden by env var on EC2)
echo -e "${YELLOW}[3/5] Building frontend image...${NC}"
docker build \
    --build-arg VITE_API_URL=http://localhost:8080 \
    -t "$FRONTEND_IMAGE" \
    ./frontend

# Push images
echo -e "${YELLOW}[4/5] Pushing backend image...${NC}"
docker push "$BACKEND_IMAGE"

echo -e "${YELLOW}[5/5] Pushing frontend image...${NC}"
docker push "$FRONTEND_IMAGE"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Images pushed to Docker Hub:"
echo -e "  - ${YELLOW}$BACKEND_IMAGE${NC}"
echo -e "  - ${YELLOW}$FRONTEND_IMAGE${NC}"
echo ""
echo -e "${BLUE}Next steps on EC2:${NC}"
echo "  1. Copy docker-compose.prod.yml and .env.prod to EC2"
echo "  2. Update .env.prod with your production values"
echo "  3. Run: docker compose -f docker-compose.prod.yml up -d"
