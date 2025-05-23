#!/bin/bash
set -euo pipefail

# Configuration
APP_NAME="ora"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run as root"
    exit 1
fi

# Check for required files
required_files=(
    "Dockerfile.prod"
    "docker-compose.prod.yml"
    ".env.prod"
    "nginx/conf.d/default.conf"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file $file not found"
        exit 1
    fi
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current data
print_status "Creating backup..."
tar -czf "$BACKUP_DIR/${APP_NAME}_${TIMESTAMP}.tar.gz" \
    ./data \
    ./logs \
    ./vault \
    ./nginx/ssl

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
    print_warning "Some services may not be healthy. Check logs with: docker-compose -f docker-compose.prod.yml logs"
fi

# Verify deployment
print_status "Verifying deployment..."
if curl -s -f "https://localhost/health" > /dev/null; then
    print_status "Deployment successful!"
else
    print_error "Deployment verification failed"
    exit 1
fi

# Cleanup old backups (keep last 5)
print_status "Cleaning up old backups..."
ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +6 | xargs -r rm

print_status "Deployment completed successfully!" 