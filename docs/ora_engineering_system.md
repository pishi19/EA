# Ora Engineering System

## Overview
This document outlines the engineering system and practices used in the Ora project, a GPT-powered local assistant system designed to manage tasks, loops, and feedback.

## System Components

### Core Components
- **EA Assistant**: Main application logic and coordination
- **Task Management**: Task routing, classification, and tracking
- **Memory System**: Vector and structured data storage
- **Interface Layer**: Streamlit UI and Obsidian integration

### Integration Points
- **Google Calendar**: Event management and scheduling
- **Gmail**: Email task extraction and processing
- **OpenAI GPT**: Task classification and natural language processing
- **Qdrant Vector Database**: Semantic search and memory
- **SQLite**: Structured data storage
- **Obsidian**: Knowledge base and interface

## Development Practices

### Code Organization
- `src/`: Core source code
  - `memory/`: Memory and persistence layer
  - `ingestion/`: Data ingestion and processing
  - `interface/`: User interface components
  - `tasks/`: Task management
  - `utils/`: Utility functions
  - `gpt_supervised/`: GPT integration
  - `graph/`: Dependency management
  - `yaml/`: Configuration handling
- `tests/`: Test files
- `docs/`: Documentation
- `config/`: Configuration files
- `scripts/`: Utility scripts
- `logs/`: Log files
- `data/`: Data storage
- `archive/`: Backup files

### Testing
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **System Tests**: End-to-end functionality testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability assessment

### Code Quality
- **Linting**: `ruff` for code style enforcement
- **Type Checking**: `mypy` for static type analysis
- **Formatting**: `black` for consistent code style
- **Pre-commit Hooks**: Automated quality checks
- **CI/CD**: GitHub Actions for automated testing

## Configuration
- **Environment Variables**: `.env` file management
- **API Keys**: Secure key storage and rotation
- **Service Configs**: YAML-based configuration
- **Logging**: Structured logging setup
- **Database**: Connection and schema management

## Deployment
- **Local Development**: Virtual environment setup
- **Production**: Containerized deployment
- **Monitoring**: System health tracking
- **Logging**: Centralized log management
- **Backup**: Automated data backup

## Security
- **API Key Management**: Secure storage and rotation
- **Dependency Scanning**: Regular security audits
- **Access Control**: Role-based permissions
- **Data Protection**: Encryption at rest
- **Audit Logging**: Security event tracking

## Contributing
- **Code Style**: Follow PEP 8 and project guidelines
- **Documentation**: Keep docs up to date
- **Testing**: Write tests for new features
- **Review**: Submit PRs for review
- **CI/CD**: Pass all automated checks

## Documentation
- **API Docs**: Function and class documentation
- **Architecture**: System design and components
- **Development**: Setup and contribution guides
- **User Guide**: End-user documentation
- **Troubleshooting**: Common issues and solutions

## Monitoring and Logging
- **System Health**: Resource usage and performance
- **Error Tracking**: Exception monitoring
- **User Activity**: Usage patterns and metrics
- **Security Events**: Access and authentication logs
- **Performance**: Response times and throughput

### Log Monitoring System
The system includes a comprehensive log monitoring solution that provides:

#### Components
- **LogMonitor**: Central monitoring class for log analysis
- **Alert System**: Multi-level alerting (INFO, WARNING, ERROR, CRITICAL)
- **Metrics Collection**: Automated collection of log metrics
- **Visualization**: Component-specific dashboards and trend analysis
- **Log Rotation**: Automated log rotation and cleanup

#### Features
- **Component-Specific Monitoring**:
  - Monitor: System monitoring logs (50MB max, 14-day retention)
  - Launchd: Service management logs (20MB max, 14-day retention)
  - Extract Loops: Data extraction logs (5MB max, 5-day retention)
  - Loop Dashboard: UI and visualization logs (8MB max, 7-day retention)
  - Feedback: User feedback logs (7MB max, 7-day retention)
  - Assistant: Assistant interaction logs (6MB max, 7-day retention)

- **Metrics Collection**:
  - Error and warning rates
  - File sizes and growth rates
  - Log rotation counts
  - Component-specific thresholds
  - Historical trend analysis

- **Alert Management**:
  - Severity-based alerting
  - Alert cooldown periods
  - Alert history tracking
  - Detailed alert reports
  - Component-specific thresholds

- **Log Management**:
  - Automated log rotation
  - Size-based rotation triggers
  - Backup file management
  - Archive organization
  - Retention policy enforcement

- **Visualization**:
  - Component dashboards
  - Growth trend analysis
  - Error rate tracking
  - Alert distribution
  - Historical metrics

#### Configuration
- **Thresholds**: Component-specific monitoring thresholds
- **Retention**: Configurable log retention periods
- **Rotation**: Size-based rotation triggers
- **Backups**: Configurable backup counts
- **Alerts**: Customizable alert conditions

#### Usage
The log monitoring system runs continuously, collecting metrics every 5 minutes and generating:
- Real-time alerts for threshold violations
- Component-specific dashboards
- Trend analysis reports
- Alert summaries
- Log rotation and cleanup

## Future Improvements
- **Scalability**: Horizontal scaling support
- **Monitoring**: Enhanced metrics and alerts
- **Security**: Advanced threat protection
- **Performance**: Optimization and caching
- **Documentation**: Expanded guides and examples 