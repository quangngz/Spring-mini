#!/bin/bash

# Development helper script for Spring-mini project
# Usage: ./dev.sh [command]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo -e "${BLUE}Spring-mini Development Helper${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}up${NC}       Start all services (build and run)"
    echo -e "  ${GREEN}down${NC}     Stop all services"
    echo -e "  ${GREEN}restart${NC}  Restart all services"
    echo -e "  ${GREEN}build${NC}    Rebuild and start all services"
    echo -e "  ${GREEN}clean${NC}    Remove all containers and volumes"
    echo -e "  ${GREEN}logs${NC}     View logs for all running containers"
    echo -e "  ${GREEN}status${NC}   Show status of all containers"
    echo ""
    echo "URLs:"
    echo -e "  ${YELLOW}Frontend: http://localhost:3000${NC}"
    echo -e "  ${YELLOW}Backend:  http://localhost:8080${NC}"
}

case "$1" in
    up)
        echo -e "${GREEN}Starting all services...${NC}"
        docker compose up -d
        echo -e "${GREEN}All services are running!${NC}"
        echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
        echo -e "${YELLOW}Backend: http://localhost:8080${NC}"
        ;;
    down)
        echo -e "${YELLOW}Stopping all services...${NC}"
        docker compose down
        echo -e "${GREEN}All services stopped.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting all services...${NC}"
        docker compose down
        docker compose up -d
        echo -e "${GREEN}All services restarted!${NC}"
        echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
        echo -e "${YELLOW}Backend: http://localhost:8080${NC}"
        ;;
    build)
        echo -e "${GREEN}Rebuilding and starting all services...${NC}"
        docker compose up -d --build
        echo -e "${GREEN}All services are running!${NC}"
        echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
        echo -e "${YELLOW}Backend: http://localhost:8080${NC}"
        ;;
    clean)
        echo -e "${RED}Removing all containers and volumes...${NC}"
        docker compose down -v
        echo -e "${GREEN}Cleanup complete!${NC}"
        ;;
    logs)
        docker compose logs -f
        ;;
    status)
        echo -e "${BLUE}Container Status:${NC}"
        docker compose ps -a
        ;;
    *)
        print_help
        ;;
esac
