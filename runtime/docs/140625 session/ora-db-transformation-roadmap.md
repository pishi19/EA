# Ora Database Transformation - Systems Roadmap & Progress Tracker

## Vision
Transform Ora from a file-based system to a contract-driven, database-backed platform where Admin serves as the genesis point for all workstreams, with full audit trails and Supabase-ready architecture.

## Success Criteria
- [ ] No workstream can exist without Admin-created contract
- [ ] All mutations are audited and traceable
- [ ] System runs on PostgreSQL locally
- [ ] Architecture is Supabase-migration ready
- [ ] Zero data loss during transformation
- [ ] All existing UI pages work with new data layer

---

## Phase 1: Foundation (Database & Admin Genesis)

### 1.1 Database Schema Design
- [ ] Document entity relationships (workstream → loop → task)
- [ ] Define contract schema requirements
- [ ] Design audit trail structure
- [ ] Plan Supabase-compatible patterns (RLS, auth)
- [ ] Create migration strategy from files

**Deliverables:**
- Entity Relationship Diagram
- Contract Schema Specification
- Audit Requirements Document
- Migration Plan

### 1.2 Local Database Setup
- [ ] PostgreSQL + pgvector local setup
- [ ] Schema creation scripts
- [ ] Seed data for testing
- [ ] Local auth solution (Supabase-compatible)

**Deliverables:**
- Docker compose configuration
- Schema SQL files
- Seed data scripts
- Setup documentation

### 1.3 Admin UI - Contract Creation
- [ ] Workstream creation wizard (blocks without contract)
- [ ] Contract validation interface
- [ ] LLM contract review integration
- [ ] Source registry management
- [ ] User/role management

**Deliverables:**
- Admin page with genesis capabilities
- Contract creation/validation flow
- Source integration registry
- Audit trail viewer

---

## Phase 2: Data Layer Integration

### 2.1 API Layer
- [ ] RESTful API for all database operations
- [ ] Authentication/authorization middleware
- [ ] Audit logging on all mutations
- [ ] File-to-DB fallback during transition

**Deliverables:**
- API endpoint documentation
- Auth implementation
- Audit log integration
- Fallback mechanism

### 2.2 Migration Tools
- [ ] File scanner (find all YAML/MD files)
- [ ] Contract extractor from existing files
- [ ] Loop/task importer
- [ ] Validation report generator
- [ ] Rollback capability

**Deliverables:**
- Migration CLI tool
- Validation reports
- Import/export utilities
- Rollback procedures

---

## Phase 3: UI Reintegration

### 3.1 Planning Page Reintegration
- [ ] Connect to database for loop creation
- [ ] Enforce workstream context from Admin
- [ ] Maintain existing UI (no refactor)
- [ ] Add contract visibility

**Deliverables:**
- DB-connected planning page
- Contract context display
- Backward compatibility

### 3.2 Workstream Filter Demo Reintegration
- [ ] Read from database instead of files
- [ ] Real-time updates from DB changes
- [ ] Permission-based filtering
- [ ] Performance optimization

**Deliverables:**
- DB-connected filter page
- Real-time subscriptions
- Permission integration

### 3.3 System Docs Reintegration
- [ ] Serve contracts from database
- [ ] Version history from audit trail
- [ ] Permission-based access
- [ ] Export capabilities

**Deliverables:**
- DB-driven docs viewer
- Version history UI
- Export functionality

---

## Phase 4: Cutover & Validation

### 4.1 Parallel Running
- [ ] Both systems operational
- [ ] Sync verification tools
- [ ] Performance comparison
- [ ] User acceptance testing

**Deliverables:**
- Sync status dashboard
- Performance reports
- UAT feedback

### 4.2 Cutover
- [ ] Data freeze on file system
- [ ] Final migration run
- [ ] Switch all pages to DB-only
- [ ] Archive file system

**Deliverables:**
- Cutover checklist
- Final migration report
- Archive documentation

### 4.3 