# Ora System Admin UI - Detailed Audit Report

**Date**: December 2024  
**Purpose**: Database schema design foundation  
**Scope**: Complete admin UI architecture and data model analysis  

## Executive Summary

The Ora System represents a sophisticated multi-tenant workstream platform with a comprehensive admin interface. This audit examines the current architecture to provide foundational insights for database schema design, focusing on multi-tenancy, role-based access control, task management, and audit capabilities.

## 1. System Architecture Overview

### 1.1 Multi-Tenant Workstream Architecture

The Ora System implements a **multi-workstream platform** with complete tenant isolation:

- **Core Concept**: Each workstream operates as an isolated domain
- **Primary Workstreams**: 
  - `ora` (system development) - **Active**
  - `mecca` (business development) - **Planning**  
  - `sales` (revenue operations) - **Planning**
- **Isolation Pattern**: Dedicated data paths, permissions, and AI contexts per workstream
- **File Structure**: `/runtime/workstreams/{name}/[artefacts|logs|roadmap.md]`

### 1.2 Technology Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with file-based data storage
- **UI Components**: shadcn/ui component library
- **State Management**: React hooks with custom context providers
- **Routing**: `/workstream/{name}/` URL structure with workstream-aware middleware

## 2. Core Data Entities & Models

### 2.1 Workstream Entity

```typescript
interface WorkstreamConfig {
  name: string;              // Unique identifier (e.g., "ora", "mecca")
  displayName: string;       // Human-readable name
  description: string;       // Purpose description
  status: 'active' | 'planning' | 'archived';
  dataPath: string;          // File system path
  allowedOperations: string[]; // Permission array
  owner?: string;            // Team/person responsible  
  phase?: string;            // Current development phase
  color?: string;            // UI theming
}
```

**Current Workstream Registry**:
- **Ora System**: Active development, Phase 11 - Filtering & Hierarchy
- **Mecca Project**: Business planning, Phase 1 - Foundation & Planning  
- **Sales & Marketing**: Revenue planning, Phase 1 - Customer Acquisition

### 2.2 Role-Based Access Control (RBAC)

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];     // ['read', 'write', 'delete', 'chat', 'mutate', 'admin']
  workstreams: string[];     // Scoped access or ['*'] for all
  isSystem?: boolean;        // System vs custom roles
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];           // Role IDs
  workstreams: string[];     // Direct workstream access
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Default System Roles**:
- **Administrator**: Full system access across all workstreams
- **Editor**: Create and edit content within assigned workstreams
- **Viewer**: Read-only access to assigned workstreams

**Permission Matrix**:
- `read` - View artefacts and data
- `write` - Create and edit content
- `delete` - Remove artefacts
- `chat` - LLM interactions
- `mutate` - Advanced mutations
- `admin` - Administrative access

### 2.3 Task Management System

```typescript
interface Task {
  id: string;
  description: string;
  added_by: 'user' | 'ora';  // Task origin
  status: 'pending' | 'done' | 'rejected' | 'promoted';
  source: string;            // Context source
  context?: string;          // Additional context
  section: 'User-Defined Tasks' | 'Ora-Suggested Tasks';
  promoted_to?: string;      // Promotion destination
}
```

**Task Lifecycle**:
1. **Creation**: User-defined or AI-suggested tasks
2. **Management**: Status tracking and editing capabilities
3. **Promotion**: Integration with loops and project files
4. **Chat Integration**: Context-aware AI assistance per task

### 2.4 Phase Management

```typescript
interface PhaseInfo {
  id: string;
  number: string;            // Phase number
  title: string;             // Phase title
  fullTitle: string;         // Complete phase description
  status?: string;           // Phase status
}
```

**Phase Structure**: Extracted from roadmap.md files using regex parsing of markdown headers.

### 2.5 Audit Logging System

```typescript
interface AuditLogEntry {
  workstream: string;
  operation: string;         // API operation type
  endpoint: string;          // API endpoint called
  data?: any;               // Request/response data
  result: 'success' | 'error';
  error?: string;           // Error details if failed
  timestamp: string;
  user?: string;            // User who performed action
}
```

**Audit Capabilities**:
- **Multi-workstream aggregation**: Consolidated view across all workstreams
- **Advanced filtering**: By workstream, operation, result, date range
- **Real-time monitoring**: Continuous audit trail capture
- **File-based storage**: Daily JSON files per workstream

## 3. Admin UI Components Analysis

### 3.1 Main Admin Dashboard (`/admin`)

**Features**:
- **Tabbed Navigation**: Phases, Artefacts, Roles, Audit, Workstreams, Context, Status
- **System Health Monitoring**: Real-time status with health indicators
- **Overview Cards**: System statistics and workstream summaries
- **Error Handling**: Comprehensive error boundaries with retry mechanisms

**Navigation Structure**:
```
/admin
├── phases          # Phase management
├── artefacts       # Bulk operations on artefacts
├── roles           # User and role management
├── audit           # Audit log viewer
├── workstreams     # Workstream creation and management
├── context         # Phase context editing
└── status          # System health monitoring
```

### 3.2 Workstream Management (`WorkstreamWizard.tsx`)

**5-Step Creation Wizard**:
1. **Basic Info**: Name, display name, description, owner, status, phase
2. **Template Selection**: Pre-configured templates (development, business, minimal)
3. **Operations/Permissions**: Granular permission assignment
4. **Structure**: Directory structure with custom folder support
5. **Review**: Final configuration review before creation

**Template System**:
- **Development Project**: Full capabilities with docs/tests folders
- **Business Initiative**: Collaboration-focused with reports/presentations
- **Minimal Setup**: Essential features only

**Permission Management**:
- Granular operation controls per workstream
- Template-based permission presets
- Custom permission combinations

### 3.3 Role & User Management (`RoleManagement.tsx`)

**Role Management**:
- **System Roles**: Predefined roles with standard permissions
- **Custom Roles**: User-defined roles with flexible permission matrices
- **Permission Inheritance**: Role-based permission aggregation
- **Workstream Scoping**: Role assignments per workstream

**User Management**:
- **Complete User Lifecycle**: Creation, editing, status management
- **Multi-role Assignment**: Users can have multiple roles
- **Effective Permissions**: Calculated permission display
- **Activity Tracking**: Last login and activity monitoring

### 3.4 Task Management (`TaskBoard.tsx`)

**Dual-Section Layout**:
- **User-Defined Tasks**: Manually created tasks
- **Ora-Suggested Tasks**: AI-generated task recommendations

**Task Features**:
- **Interactive Chat**: Context-aware AI assistance per task
- **Status Management**: Pending → Done/Rejected → Promoted workflow
- **Task Promotion**: Integration with loops and project files
- **Bulk Operations**: Multiple task management capabilities

**Promotion System**:
- **Existing Loop**: Promote to existing execution loop
- **New Loop**: Create new loop for task execution
- **Project Task File**: Integrate with project management files

### 3.5 Audit System (`AuditLogViewer.tsx`)

**Comprehensive Logging**:
- **Multi-workstream View**: Consolidated audit across all workstreams
- **Advanced Filtering**: Workstream, operation, result, date range filters
- **Performance Optimization**: Pagination and efficient file reading
- **Error Handling**: Graceful handling of malformed log files

**Audit Data Structure**:
- **Daily Log Files**: JSON format per workstream per day
- **Operation Tracking**: All API calls with request/response data
- **Error Logging**: Complete error context and stack traces
- **User Attribution**: User identification for all operations

## 4. API Architecture Patterns

### 4.1 Workstream-Aware Middleware

```typescript
export function withWorkstreamContext<T>(
  handler: (request: NextRequest, context: WorkstreamContext) => Promise<NextResponse<T>>
)
```

**Workstream Detection Priority**:
1. URL path parameter (`/workstream/[name]/api/...`)
2. Query parameter (`?workstream=name`)
3. Request body (POST/PUT requests)
4. Custom header (`x-workstream`)

**Context Injection**:
- Automatic workstream validation
- Configuration loading
- Permission checking
- Audit logging setup

### 4.2 File System Integration

**Hybrid Storage Pattern**:
- **Database**: Metadata, relationships, user data
- **File System**: Content, artefacts, logs
- **Directory Structure**: Standardized workstream organization

**Path Utilities**:
```typescript
getWorkstreamDataPath(workstream: string, ...segments: string[]): string
getWorkstreamArtefactsPath(workstream: string): string
getWorkstreamLogsPath(workstream: string): string
getWorkstreamRoadmapPath(workstream: string): string
```

### 4.3 Permission Validation

**Operation-Level Security**:
- Workstream-scoped permission checking
- Role-based access control validation
- Operation-specific authorization
- Audit trail for all access attempts

## 5. Database Schema Recommendations

### 5.1 Core Tables Structure

```sql
-- Workstreams (Multi-tenant isolation)
CREATE TABLE workstreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('active', 'planning', 'archived')),
    data_path VARCHAR(500),
    owner VARCHAR(100),
    current_phase VARCHAR(200),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions (operation types)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- read, write, delete, chat, mutate, admin
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Roles (RBAC system)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users 
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction Tables for Many-to-Many Relationships
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    workstream_id UUID REFERENCES workstreams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id, workstream_id)
);

CREATE TABLE workstream_permissions (
    workstream_id UUID REFERENCES workstreams(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (workstream_id, permission_id)
);
```

### 5.2 Task Management Tables

```sql
-- Tasks (workstream-scoped)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstreams(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    added_by VARCHAR(20) NOT NULL CHECK (added_by IN ('user', 'ora')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'rejected', 'promoted')),
    source VARCHAR(200),
    context TEXT,
    section VARCHAR(50) CHECK (section IN ('User-Defined Tasks', 'Ora-Suggested Tasks')),
    promoted_to VARCHAR(200),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Phases (roadmap management)
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstreams(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'planned')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workstream_id, number)
);

-- Task Chat Messages (context-aware AI conversations)
CREATE TABLE task_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.3 Audit & Logging Tables

```sql
-- Audit logs (compliance & monitoring)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstreams(id),
    user_id UUID REFERENCES users(id),
    operation VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'error')),
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE system_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstreams(id),
    component VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'error')),
    metrics JSONB,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 Performance Optimization Indices

```sql
-- Workstream access patterns
CREATE INDEX idx_workstreams_status ON workstreams(status);
CREATE INDEX idx_workstreams_name ON workstreams(name);

-- User and role queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_roles_workstream ON user_roles(workstream_id);

-- Task management queries
CREATE INDEX idx_tasks_workstream_status ON tasks(workstream_id, status);
CREATE INDEX idx_tasks_added_by ON tasks(added_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Audit log performance
CREATE INDEX idx_audit_logs_workstream ON audit_logs(workstream_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_result ON audit_logs(result);

-- Composite indices for common queries
CREATE INDEX idx_audit_logs_workstream_operation ON audit_logs(workstream_id, operation);
CREATE INDEX idx_tasks_workstream_user ON tasks(workstream_id, created_by);
```

## 6. Row-Level Security (RLS) Implementation

### 6.1 Workstream Isolation Policy

```sql
-- Enable RLS on workstream-scoped tables
ALTER TABLE workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workstream isolation
CREATE POLICY workstream_isolation_policy ON tasks
    FOR ALL
    TO authenticated_users
    USING (workstream_id IN (
        SELECT w.id FROM workstreams w
        JOIN user_roles ur ON w.id = ur.workstream_id
        WHERE ur.user_id = current_user_id()
    ));

CREATE POLICY workstream_admin_policy ON workstreams
    FOR ALL
    TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = current_user_id()
            AND p.name = 'admin'
            AND (ur.workstream_id = workstreams.id OR r.name = 'Administrator')
        )
    );
```

### 6.2 Permission-Based Access

```sql
-- Function to check workstream permissions
CREATE OR REPLACE FUNCTION has_workstream_permission(
    target_workstream_id UUID,
    required_permission VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = current_user_id()
        AND ur.workstream_id = target_workstream_id
        AND p.name = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Migration Strategy

### 7.1 Phase 1: Foundation (Weeks 1-2)
- Core workstream and user management tables
- Basic RBAC implementation
- Workstream isolation policies
- Initial data migration from file-based system

### 7.2 Phase 2: Task Management (Weeks 3-4)
- Task and phase management integration
- Chat message storage
- Task promotion workflow
- Historical task data migration

### 7.3 Phase 3: Audit System (Weeks 5-6)
- Comprehensive audit log migration
- System health monitoring
- Performance optimization
- Audit file to database conversion

### 7.4 Phase 4: Advanced Features (Weeks 7-8)
- Full-text search capabilities
- Analytics and reporting
- Advanced workstream templates
- Performance monitoring and optimization

## 8. Scalability Considerations

### 8.1 Database Performance
- **Partitioning**: Audit logs by date and workstream
- **Indexing Strategy**: Composite indices for common query patterns
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Materialized views for complex aggregations

### 8.2 Caching Strategy
- **Redis Integration**: Frequently accessed workstream configurations
- **Application-Level Caching**: User permissions and role data
- **CDN**: Static assets and documentation
- **Query Result Caching**: Expensive audit log aggregations

### 8.3 Monitoring & Observability
- **Real-time Metrics**: Database performance monitoring
- **Audit Dashboards**: Workstream usage analytics
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Profiling**: Query performance monitoring

## 9. Security Considerations

### 9.1 Data Protection
- **Encryption at Rest**: Sensitive data encryption
- **Encryption in Transit**: TLS for all communications
- **Data Anonymization**: PII handling in audit logs
- **Backup Security**: Encrypted backup storage

### 9.2 Access Control
- **Multi-Factor Authentication**: Enhanced user security
- **Session Management**: Secure session handling
- **API Rate Limiting**: DoS protection
- **Input Validation**: SQL injection prevention

### 9.3 Compliance
- **Audit Retention**: Configurable retention policies
- **Data Residency**: Geographic data storage requirements
- **GDPR Compliance**: Right to deletion and data portability
- **SOC2 Readiness**: Security control framework

## Conclusion

The Ora System presents a sophisticated multi-tenant architecture with comprehensive admin capabilities. The proposed database schema provides a solid foundation for scalable, secure, and maintainable data management while preserving the existing workstream isolation patterns and RBAC requirements.

**Key Implementation Priorities**:
1. **Multi-tenant row-level security** for workstream isolation
2. **Flexible RBAC system** with granular permissions
3. **Comprehensive audit logging** for compliance and monitoring
4. **Performance optimization** for scale
5. **Migration strategy** that maintains system availability

This audit serves as the foundation for database schema discussions and implementation planning, ensuring that the new database design aligns with the existing application architecture and user workflows.

---

**Report Generated**: December 2024  
**Next Steps**: Database schema design review and implementation planning  
**Contact**: System Architecture Team