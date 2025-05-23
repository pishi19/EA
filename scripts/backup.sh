#!/bin/bash

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/ora/backups}"
DATA_DIR="${DATA_DIR:-/opt/ora/data}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ora_backup_${TIMESTAMP}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

create_backup() {
    log "Creating backup ${BACKUP_NAME}"
    
    # Create backup directory
    mkdir -p "${BACKUP_DIR}"
    
    # Check if at least one data directory exists
    if [ ! -d "${DATA_DIR}/qdrant" ] && [ ! -d "${DATA_DIR}/redis" ] && [ ! -d "${DATA_DIR}/app" ]; then
        error "No data directories found in ${DATA_DIR}. Aborting backup."
    fi
    
    # Backup Qdrant data
    log "Backing up Qdrant data..."
    if [ -d "${DATA_DIR}/qdrant" ]; then
        tar czf "${BACKUP_DIR}/${BACKUP_NAME}_qdrant.tar.gz" -C "${DATA_DIR}/qdrant" .
    else
        warn "Qdrant data directory not found, skipping..."
    fi
    
    # Backup Redis data
    log "Backing up Redis data..."
    if [ -d "${DATA_DIR}/redis" ]; then
        tar czf "${BACKUP_DIR}/${BACKUP_NAME}_redis.tar.gz" -C "${DATA_DIR}/redis" .
    else
        warn "Redis data directory not found, skipping..."
    fi
    
    # Backup application data
    log "Backing up application data..."
    if [ -d "${DATA_DIR}/app" ]; then
        tar czf "${BACKUP_DIR}/${BACKUP_NAME}_app.tar.gz" -C "${DATA_DIR}/app" .
    else
        warn "Application data directory not found, skipping..."
    fi
    
    # Create backup manifest
    cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Backup created: ${TIMESTAMP}
Components:
- Qdrant data
- Redis data
- Application data
EOF
    
    log "Backup completed successfully"
}

cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days"
    find "${BACKUP_DIR}" -name "ora_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
}

rollback() {
    local backup_name=$1
    
    if [ ! -f "${BACKUP_DIR}/${backup_name}_manifest.txt" ]; then
        error "Backup ${backup_name} not found"
    fi
    
    log "Starting rollback to ${backup_name}"
    
    # Restore Qdrant data
    log "Restoring Qdrant data..."
    if [ -f "${BACKUP_DIR}/${backup_name}_qdrant.tar.gz" ]; then
        mkdir -p "${DATA_DIR}/qdrant"
        rm -rf "${DATA_DIR}/qdrant"/*
        tar xzf "${BACKUP_DIR}/${backup_name}_qdrant.tar.gz" -C "${DATA_DIR}/qdrant"
    else
        warn "Qdrant backup not found, skipping..."
    fi
    
    # Restore Redis data
    log "Restoring Redis data..."
    if [ -f "${BACKUP_DIR}/${backup_name}_redis.tar.gz" ]; then
        mkdir -p "${DATA_DIR}/redis"
        rm -rf "${DATA_DIR}/redis"/*
        tar xzf "${BACKUP_DIR}/${backup_name}_redis.tar.gz" -C "${DATA_DIR}/redis"
    else
        warn "Redis backup not found, skipping..."
    fi
    
    # Restore application data
    log "Restoring application data..."
    if [ -f "${BACKUP_DIR}/${backup_name}_app.tar.gz" ]; then
        mkdir -p "${DATA_DIR}/app"
        rm -rf "${DATA_DIR}/app"/*
        tar xzf "${BACKUP_DIR}/${backup_name}_app.tar.gz" -C "${DATA_DIR}/app"
    else
        warn "Application backup not found, skipping..."
    fi
    
    log "Rollback completed successfully"
}

list_backups() {
    log "Available backups:"
    for manifest in "${BACKUP_DIR}"/ora_backup_*_manifest.txt; do
        if [ -f "$manifest" ]; then
            backup_name=$(basename "$manifest" _manifest.txt)
            echo "- ${backup_name}"
        fi
    done
}

# Main
case "${1:-}" in
    "create")
        create_backup
        cleanup_old_backups
        ;;
    "rollback")
        if [ -z "${2:-}" ]; then
            error "Please specify backup name"
        fi
        rollback "$2"
        ;;
    "list")
        list_backups
        ;;
    *)
        echo "Usage: $0 {create|rollback|list} [backup_name]"
        exit 1
        ;;
esac 