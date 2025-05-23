# Production Environment Documentation

## Overview

The Ora system's production environment is designed for reliability, security, and maintainability. This document outlines the key components, configuration, and operational procedures.

## Architecture

### Components

1. **Application Server**
   - Python application running with Gunicorn
   - Uvicorn ASGI server
   - Non-root user for security
   - Environment-based configuration

2. **Database Layer**
   - Qdrant for vector storage
   - Redis for caching and job queues
   - Regular backups and monitoring

3. **Web Server**
   - Nginx for reverse proxy
   - SSL/TLS termination
   - Security headers
   - Static file serving

4. **Monitoring**
   - Log monitoring with rotation
   - Health checks
   - Alert system
   - Performance metrics

## Deployment

### Prerequisites

- Docker and Docker Compose
- Git
- SSH access to production server
- SSL certificates
- Environment variables

### Configuration Files

1. **Dockerfile.prod**
   ```dockerfile
   FROM python:3.9-slim
   # ... (see Dockerfile.prod for details)
   ```

2. **docker-compose.prod.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile.prod
       # ... (see docker-compose.prod.yml for details)
   ```

3. **Nginx Configuration**
   ```nginx
   upstream ora_app {
       server app:8000;
   }
   # ... (see nginx/conf.d/default.conf for details)
   ```

### Environment Variables

Required environment variables in `.env.prod`:
```
# API Keys
OPENAI_API_KEY=
QDRANT_API_KEY=

# Database
QDRANT_HOST=qdrant
REDIS_HOST=redis

# Security
SECRET_KEY=
ALLOWED_HOSTS=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=

# Monitoring
LOG_LEVEL=WARNING
ALERT_THRESHOLD=50
```

## Backup and Recovery

### Backup System

The backup system (`scripts/backup.sh`) provides:

1. **Regular Backups**
   - Qdrant database
   - Redis data
   - Application data
   - Backup manifests

2. **Retention Policy**
   - 30-day retention period
   - Automatic cleanup of old backups
   - Backup rotation

3. **Recovery Procedure**
   ```bash
   # List available backups
   ./scripts/backup.sh list

   # Create new backup
   ./scripts/backup.sh create

   # Rollback to specific backup
   ./scripts/backup.sh rollback ora_backup_20250523_123456
   ```

## Monitoring and Alerts

### Log Monitoring

1. **Configuration**
   - 1MB rotation size
   - 3 backup files
   - 10-minute monitoring interval
   - WARNING level logging

2. **Alert Thresholds**
   - Log growth: 50%
   - Error rate: 10%
   - Response time: 2s

3. **Dashboard**
   - Loop health metrics
   - System performance
   - Error tracking
   - Growth trends

## CI/CD Pipeline

### GitHub Actions Workflow

1. **Test Stage**
   - Python setup
   - Dependency installation
   - Unit tests
   - Linting

2. **Deploy Stage**
   - SSH configuration
   - Production deployment
   - Health verification

### Deployment Process

1. **Pre-deployment**
   - Run tests
   - Check linting
   - Verify dependencies

2. **Deployment**
   - Pull latest changes
   - Build containers
   - Update services
   - Verify health

3. **Post-deployment**
   - Monitor logs
   - Check metrics
   - Verify functionality

## Security Measures

1. **Container Security**
   - Non-root user
   - Minimal base image
   - Regular updates

2. **Network Security**
   - SSL/TLS encryption
   - Security headers
   - Rate limiting

3. **Data Security**
   - Encrypted backups
   - Secure credentials
   - Access controls

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor logs
   - Check backups
   - Verify health

2. **Weekly**
   - Review metrics
   - Clean old logs
   - Update dependencies

3. **Monthly**
   - Security updates
   - Performance review
   - Capacity planning

### Troubleshooting

1. **Common Issues**
   - Log growth alerts
   - Service unavailability
   - Performance degradation

2. **Resolution Steps**
   - Check logs
   - Verify configurations
   - Review metrics
   - Apply fixes

## Support

For production issues:
1. Check the logs in `/opt/ora/logs/`
2. Review the monitoring dashboard
3. Consult the troubleshooting guide
4. Contact system administrators

## Future Improvements

1. **Planned Enhancements**
   - Enhanced monitoring
   - Automated scaling
   - Advanced backup features
   - Performance optimization

2. **Known Issues**
   - Log growth in scheduler.log
   - Alert report generation
   - Memory usage in dashboard

## References

- [System Overview](../System/Reference/ea_system_overview.md)
- [Development Guide](./development.md)
- [API Documentation](./api.md)
- [Security Policy](./security.md) 