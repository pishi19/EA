---
title: Ora System Roadmap
created: 2025-06-08
last_updated: 2025-06-08
tags: [roadmap, phases, planning, documentation]
---

## Current Focus

- **Next Task:** 11.3.1 Interactive Roadmap Tree Navigation UI
- **Project:** 11.3 Interactive Roadmap Tree Navigation
- **Phase:** 11 – Artefact Hierarchy and Filtering
- **Status:** ready for implementation
- **Owner:** Ash
- **Priority:** High
- **Notes:** With taxonomy filtering enforcement complete, next step is implementing tree component/sidebar for interactive roadmap navigation with in-situ chat and memory trace integration.

# Ora Roadmap

## Current Major Phases

1. **Phase 11:** Artefact Hierarchy and Filtering (Contextual-Chat-Demo UI)
2. **Phase 12:** Administration & Workstream Structure Management
3. **Phase 13:** Data Audit and Logical Grouping
4. **Phase 14+:** Semantic Feature Enhancements (tags, chat, scoring, sources, etc.)

## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Artefact Hierarchy, Filtering & Chat
  - Project 11.1: Artefact Schema Canonicalization
      - Task 11.1.1: Design canonical artefact schema
      - Task 11.1.2: Document schema in system docs
  - Project 11.2: Filtering, Mutation, Semantic Chat
      - Task 11.2.1: Filtering Logic
      - Task 11.2.2: Inline Task Mutation
      - Task 11.2.3: Optimistic UI
      - Task 11.2.4: Batch/Undo
      - Task 11.2.5: Taxonomy Filtering
      - Task 11.2.6: Contextual Chat Embedding (Ora Chat)
      - Task 11.2.7: LLM Agent Integration v1 (roadmap/chat/slice agent)
      - Task 11.2.8: Test Coverage & Bug Audits
      - Task 11.2.9: UI Accessibility Audit

  - Project 11.3: Interactive Roadmap Tree Navigation
      - Task 11.3.1: Tree Component/Sidebar
      - Task 11.3.2: In-situ Chat & Memory Trace in Tree
      - Task 11.3.3: Node-based Mutation/Consultation

### Phase 12: Administration & Governance
  - Project 12.4: Automated Artefact File Creation & Mutation Syncing
      - Task 12.4.1: System-level automation for artefact file creation
          - Description: When a new task/project is created via UI or API, system automatically generates the artefact file in `/runtime/loops/` with canonical frontmatter, status, and taxonomy fields.
      - Task 12.4.2: Bidirectional sync between roadmap.md and artefact files
          - Description: Ensure all status, field, and mutation changes are instantly reflected in both the roadmap and artefact file, regardless of source.
      - Task 12.4.3: Orphan detection and remediation
          - Description: Automated jobs to find and fix orphaned or unsynced artefacts/files.
      - Task 12.4.4: System integrity & recovery testing
          - Description: Regular tests and simulations to confirm end-to-end self-healing, with error reporting and rollback.
  - Project 12.1: Admin UI (Phases, Projects, Artefacts)
      - Task 12.1.1: Admin page for managing phases/programs
      - Task 12.1.2: Project/artefact CRUD, grouping, archiving
  - Project 12.2: Ownership, Permissions, and Audit Logs
      - Task 12.2.1: Role management and user assignment
      - Task 12.2.2: Audit log UI and protocol
  - Project 12.3: Workstream Structure Management
      - Task 12.3.1: Workstream CRUD and configuration

### Phase 13: Data Audit & Compliance
  - Project 13.1: Artefact Audit, Migration, and Schema Correction
      - Task 13.1.1: Artefact audit scripts
      - Task 13.1.2: Automated migration and correction jobs
  - Project 13.2: Bulk Edit, Merge, Retag
      - Task 13.2.1: Bulk edit UI and API
      - Task 13.2.2: Merge and retag artefacts
  - Project 13.3: Legacy Archive Management
      - Task 13.3.1: Legacy artefact migration/archival UI

### Phase 14: Semantic/LLM Feature Enhancements
  - Project 14.1: Advanced Tagging & Scoring
      - Task 14.1.1: Tag editing UI and tag-driven filtering
      - Task 14.1.2: Artefact scoring and priority algorithms
  - Project 14.2: Source Integration (Gmail, Slack, etc)
      - Task 14.2.1: Email/Slack ingestion pipelines
      - Task 14.2.2: Source mapping to artefact schema
  - Project 14.3: LLM-Powered Search, Reasoning, and Automation
      - Task 14.3.1: Agentic LLM Suggestions (roadmap)
      - Task 14.3.2: LLM Auto-Promote Loop/Task
      - Task 14.3.3: LLM-Driven Compliance Audit

## Status

- Phase 10.2: Complete
- Phase 11: In Progress

## Phase 11 – Artefact Hierarchy and Filtering

**Program**: Phase 11 – Artefact Hierarchy and Filtering  
**Status**: In Progress  
**Start Date**: 2025-06-08  
**Owner**: System Architecture Team  

### Project 11.1: Artefact Schema and Canonicalization
**Status**: ✅ COMPLETE  
**Completion Date**: 2025-06-08  

#### Task 11.1.1: Design canonical artefact schema
- **Status**: ✅ COMPLETE
- **Deliverable**: Comprehensive schema patterns analysis
- **Output**: `runtime/logs/loop_schema_patterns.md`
- **Notes**: Analyzed 55 loop files, identified 27 unique frontmatter fields and 78 section headings

#### Task 11.1.2: Document schema in system docs
- **Status**: ✅ COMPLETE
- **Deliverable**: Schema documentation and integration recommendations
- **Output**: Integration patterns for Gmail, Slack, and planning tools
- **Notes**: High-value fields identified: title, uuid, created, source, workstream, status, tags

### Project 11.2: Semantic Chat Demo Filtering
**Status**: ✅ COMPLETE  
**Completion Date**: 2025-06-08  

#### Task 11.2.1: Implement filtering logic
- **Status**: ✅ COMPLETE
- **Deliverable**: Multi-dimensional filtering engine
- **Notes**: Workstream, program (phase-based), project (tag-based), status filtering with real-time updates

#### Task 11.2.2: Integrate UI filter components
- **Status**: ✅ COMPLETE
- **Deliverable**: Comprehensive filter interface
- **Notes**: 6-column responsive grid with shadcn/ui Select components, dynamic count displays

#### Task 11.2.3: Test filtering across artefact types
- **Status**: ✅ COMPLETE
- **Deliverable**: Validated filtering across 53+ artefacts
- **Notes**: Independent and combination filtering working, no regressions detected

### Project 11.2.2: Inline Task Mutation in Filtered View
**Status**: 🔄 IN PROGRESS  
**Start Date**: 2025-12-14  

#### Phase 11.2.2: Implement inline task mutation (add/edit/delete) in the filtered view
- **Status**: 🔄 IN PROGRESS
- **Deliverable**: Inline task mutation functionality within filtered roadmap/task view UI
- **Notes**: Add, edit, and delete actions for tasks routed through API with proper versioning and logging

#### Task 11.2.2.1: Scaffold inline mutation UI controls
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-12-14
- **Deliverable**: UI components for add/edit/delete task operations within filtered views
- **Notes**: Implemented InlineTaskEditor, TaskMutationControls, API routes, keyboard shortcuts, and full integration with workstream filter demo

#### Task 11.2.2.2: Integrate Optimistic UI for Inline Task Mutations
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-12-14
- **Deliverable**: Seamless optimistic updates for all inline task mutations
- **Notes**: Implemented optimistic state management, pending indicators, rollback logic, and comprehensive error recovery for all mutation operations


#### Task 11.2.2.3: Batch Task Mutation & Undo Functionality
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-12-15
- **Deliverable**: Comprehensive batch add/edit/delete and undo/redo for tasks/artefacts in filtered project view, production-ready.
- **Notes**:
    1. Multi-select UI Controls
        - Checkboxes on every task card for individual selection
        - Master "Select All/None" checkbox with indeterminate states
        - Keyboard shortcuts: Ctrl+A (select all), Ctrl+Z (undo), Ctrl+Y (redo), Delete (batch delete)
        - Visual feedback for selected, pending, and failed states
    2. Batch Mutation API
        - New /api/task-mutations/batch endpoint handling arrays of operations
        - Support for batch add, edit, and delete operations
        - Individual operation tracking with unique operation IDs
        - Partial failure handling with detailed error reporting
        - Rollback data generation for undo functionality
    3. Optimistic UI
        - Immediate UI updates for all selected tasks
        - Visual pending indicators during API processing
        - Automatic rollback on operation failures
        - Error highlighting for failed tasks with timeout cleanup
    4. Undo/Redo System
        - Global undo stack with 50-action history (configurable)
        - Complete action tracking with descriptions and timestamps
        - Keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y)
        - Visual feedback showing last action and history count
        - Custom rollback functions for each operation type
    5. Integration & Architecture
        - Seamless integration with existing workstream filter demo
        - Mode switching between single and batch operations
        - Taxonomy alignment with canonical schema
        - Full TypeScript type safety throughout
    6. Testing & Quality
        - Comprehensive component tests (3 test suites passing)
        - API endpoint validation and error handling
        - Production-ready implementation with error boundaries
        - Complete documentation and execution logs
    🏗️ Key Files Created/Modified
        - New components: BatchTaskControls, SelectableTaskCard
        - New hook: useUndoRedo
        - New API endpoint: /api/task-mutations/batch
        - Test Coverage: 14 test cases across UI and API
        - ~1,000+ lines of production-ready TypeScript/React
    🚀 Live Features Now Available
        - Toggle Batch Mode: "⚡ Batch Mode" button
        - Select Tasks: Use checkboxes or "Select All"
        - Batch Operations: Edit or Delete multiple tasks simultaneously
        - Undo/Redo: Full undo/redo with Ctrl+Z and Ctrl+Y shortcuts
        - Visual Feedback: Real-time status for pending/failed ops
        - Error Handling: Partial failure recovery with highlighting
    🎯 Production Ready
        - Full error handling and recovery
        - Optimistic UI with rollback
        - Keyboard accessibility and visual state management
        - Integrated with taxonomy and filtering
        - Running live on port 3000

# After completion, we will proceed to Task 11.2.4.1: Implement canonical taxonomy filtering.

### Project 11.2.4: Taxonomy-Driven Filtering Enforcement
**Status**: planning
**Start Date**: 2025-12-14

#### Task 11.2.4.1: Implement canonical taxonomy filtering (workstream → program → project → artefact)
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-12-15
- **Deliverable**: UI and API both filter and present artefacts according to full taxonomy model (workstream → program → project → artefact type → status)
- **Owner**: Ash
- **Notes**: 
    1. Enhanced Taxonomy Model
        - Default "Ora" workstream for all artefacts (with fallback normalization)
        - Hierarchical filtering: Workstream → Program → Project → Artefact Type → Status
        - Artefact type enforcement (task, note, thought, execution, loop)
        - Taxonomy compliance validation (orphaned items normalized)
    2. UI Implementation
        - Added artefact type filter dropdown with canonical type options
        - Enhanced filter grid layout (1-7 columns responsive)
        - Real-time hierarchical filtering with dependency cascading
        - Updated labels and descriptions for taxonomy clarity
        - "Clear All Filters" resets to Ora workstream default
    3. API/Data Layer
        - Enhanced filtering logic with taxonomy compliance enforcement
        - Automatic normalization of non-compliant workstreams to "Ora"
        - Automatic normalization of non-compliant types to "task"
        - Only taxonomy-compliant artefacts shown in filtered results
    4. Testing & Validation
        - Comprehensive test suite (10 test cases) covering all filter combinations
        - Validation of hierarchical dependencies and edge cases
        - Confirmed taxonomy compliance enforcement working correctly
        - Production-ready implementation with error handling

### Project 11.3: Legacy Data Cleanup
**Status**: ✅ COMPLETE  
**Completion Date**: 2025-06-08  

#### Task 11.3.1: Audit legacy loop files
- **Status**: ✅ COMPLETE
- **Deliverable**: Comprehensive metadata audit report
- **Output**: `runtime/logs/loop_metadata_audit.md`
- **Notes**: 44 files (80%) identified with metadata issues requiring attention

#### Task 11.3.2: Migrate compliant artefacts
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-06-08
- **Deliverable**: Complete archival of 54 legacy files to establish canonical schema foundation
- **Notes**: 52 loop files and 2 task files archived with comprehensive documentation

#### Task 11.3.3: Archive non-compliant artefacts
- **Status**: ✅ COMPLETE
- **Completion Date**: 2025-06-08
- **Deliverable**: Legacy artefacts archived with comprehensive documentation and canonical schema requirements
- **Notes**: All legacy content preserved in archive subdirectories with complete historical integrity

## Change Log

- [2025-12-15] Task 11.2.4.1 Taxonomy Filtering Enforcement completed – Successfully implemented comprehensive hierarchical filtering UI and API enforcement for the full canonical taxonomy model (workstream → program → project → artefact type → status). Features include default "Ora" workstream, artefact type filtering (task, note, thought, execution, loop), taxonomy compliance enforcement with automatic normalization, enhanced 7-column responsive filter grid, real-time cascading dependencies, and comprehensive test coverage (10 test cases). Production-ready implementation ensures only taxonomy-compliant artefacts are displayed.

- [2025-12-14] Expanded System Roadmap added: Full canonical breakdown of all phases, projects, tasks, LLM integration, chat, admin, audit, compliance, and semantic enhancements now visible for consultation, review, and execution. This structure governs future planning, review, and priority setting.

- [2025-12-14] Task 11.2.4.1 Taxonomy Filtering Enforcement initiated – Scaffolding new filtering logic and UI refactor to enforce canonical taxonomy (workstream/program/project/artefact) across all API, queries, and interfaces. Filtering controls and discoverability will now fully reflect semantic hierarchy and schema.

- [2025-12-14] Task 11.2.2.3 Batch Task Mutation & Undo completed – Successfully implemented comprehensive batch mutation system with multi-select UI controls, batch API endpoint (/api/task-mutations/batch), optimistic UI updates, global undo/redo functionality, and full test coverage (14 test cases). Features include keyboard shortcuts, partial failure handling, visual state management, and seamless integration with existing filtering. Production-ready implementation.
- [2025-12-14] Task 11.2.2.3 Batch Task Mutation & Undo initiated – Multi-select, batch mutation, and undo/redo implemented with full taxonomy and optimistic UI compliance.
- [2025-12-14] Canonical taxonomy commit: Standardized hierarchy (workstream/program/project/artefact). "Ora" is default workstream/root. All artefacts (tasks, notes, thoughts) must exist in roadmap tree, with unified frontmatter and UI filter logic. Commit and tag: taxonomy-2025-12-14-canonical-structure.
- [2025-12-14] Task 11.2.2.2 Optimistic UI Integration completed - Successfully implemented comprehensive optimistic UI system with immediate feedback, pending state indicators, and automatic rollback on API failures. All inline task mutations (add/edit/delete) now provide seamless user experience with visual feedback during operation and graceful error recovery. Optimistic state management maintains filter consistency and real-time updates (linked to Phase 11.2.2 vertical slice progression)
- [2025-12-14] Task 11.2.2.2 Optimistic UI Integration initiated - Implement optimistic updates for inline add/edit/delete, ensuring immediate UI feedback and rollback on mutation failure. Building on Task 11.2.2.1 foundation to provide seamless user experience with pending states and error recovery (linked to Phase 11.2.2 vertical slice progression)
- [2025-12-14] Task 11.2.2.1 UI Controls Implementation completed - Successfully implemented comprehensive inline task mutation system with InlineTaskEditor and TaskMutationControls components. Full CRUD API integration with /api/task-mutations endpoint. Keyboard shortcuts (Ctrl+N, Ctrl+E, Delete), form validation, error handling, and real-time UI updates. Tested and verified functionality in workstream-filter-demo with successful task creation and filtering (linked to Phase 11.2.2 vertical slice progression)
- [2025-12-14] Task 11.2.2.1 UI Controls Implementation initiated - Created first implementation task for scaffolding inline mutation UI controls within filtered roadmap view. Moved Phase 11.2.2 from planning to in_progress status. Task focuses on reusable UI components for add/edit/delete operations with seamless inline editing capabilities (linked to Phase 11.2.2 vertical slice progression)
- [2025-12-14] Phase 11.2.2 Inline Task Mutation initiated - Created new project for implementing add/edit/delete actions for tasks inline within the filtered roadmap/task view UI. All mutations will be routed through API with proper versioning and logging. Artefact scaffolded with canonical frontmatter and linked to roadmap hierarchy (linked to Phase 11 vertical slice progression)
- [2025-12-13] Semantic Chat Classic Restoration completed - Restored previously lost "Semantic Chat Classic" page with embedded, expandable context-aware chat for each artefact. Features include individual expand/collapse chat controls, bulk expand/collapse functionality, contextual chat scoped to loop UUID and file path with persistent history, filtering preservation across chat states, and Memory Trace/Execution Log integration. Added to navigation alongside existing "Semantic Chat" without replacement. Created Collapsible UI component and established dual semantic chat interface pattern (linked to Phase 11 UI architecture enhancements)
- [2025-12-13] Comprehensive Artefact Filtering Implementation completed - Implemented full multi-dimensional artefact filtering in Semantic Chat Demo with workstream, program (phase), and project (tags) filtering capabilities. Enhanced with real-time filtering of 53+ artefacts, dynamic counts, comprehensive sorting options, and filter reset functionality following established UI patterns from SystemView/PhaseDocView (linked to Phase 11 UI enhancements)
- [2025-12-13] Semantic Chat Demo Elevation & Enhanced Filtering completed - Elevated Contextual Chat Demo to primary navigation as "Semantic Chat" with comprehensive artefact filtering (workstream, phase/program, tag/project, status) and real-time filter effects, establishing semantic chat as core architectural feature (linked to Phase 11 UI enhancements)
- [2025-12-13] Workstream Filtering UI Enhancement completed - Added workstream filtering dropdown to PhaseDocView component, achieving consistent workstream-based filtering across all loop views (SystemView and PhaseDocView) with proper API integration and responsive design (linked to Phase 11 UI enhancements)
- [2025-12-13] System Docs UI Integration completed - Added dedicated "System Docs" tab to Contextual Chat Demo UI, surfacing all `/runtime/docs/` files with read-only markdown rendering (linked to Phase 11 UI enhancements)
- [2025-06-08] Phase 11 hierarchical structure implemented - Established program/project/task hierarchy with explicit tracking and status management
- [2025-06-08] Roadmap doc seeded for canonical reference.

# Project Roadmap

## 2025-06-08: Loop Schema Patterns Analysis System

**Capability**: Comprehensive Schema Analysis & Integration Planning  
**Status**: ✅ COMPLETE  
**Impact**: High - Foundation for artefact standardization and source integration  

### Implementation Summary
Delivered comprehensive schema patterns analysis system that analyzes all loop files for YAML frontmatter and markdown section patterns, providing integration recommendations for external sources.

### Key Achievements
- **Complete Schema Analysis**: Analyzed 55 loop files identifying 27 unique frontmatter fields and 78 section headings
- **Integration Recommendations**: Specific mapping guidance for Gmail, Slack, and planning tool integration
- **Data Quality Insights**: Field completeness analysis and standardization opportunities
- **Future Architecture**: Technical implementation notes for schema validation and templates

### Technical Deliverables
1. **Analysis Script**: `scripts/analyze-loop-schema-patterns.ts` with comprehensive pattern detection
2. **Schema Report**: `runtime/logs/loop_schema_patterns.md` with detailed analysis and recommendations
3. **Integration Mappings**: Source-specific mapping recommendations for external systems
4. **Evolution Roadmap**: Schema standardization and emerging pattern identification

### Business Value
- **Integration Readiness**: Clear roadmap for external source integration (Gmail, Slack, planning tools)
- **Data Standardization**: Identification of high-value fields for prioritized integration
- **Quality Framework**: Schema validation foundation for future artefact creation
- **Semantic Enhancement**: Support for AI-powered analysis and reasoning capabilities

### Critical Insights
- **Top Fields**: origin (96%), title (93%), tags (91%), uuid (91%), created (85%)
- **Core Sections**: Execution Log (82%), Purpose (78%), Objectives (76%), Memory Trace (75%), Tasks (71%)
- **Integration Value**: 7 high-value fields identified for external source mapping
- **Evolution Patterns**: 17 fields need standardization, 5 core sections well-established

## 2025-06-08: Loop Metadata Audit System

**Capability**: Data Quality Analysis & Audit Automation  
**Status**: ✅ COMPLETE  
**Impact**: High - Foundation for data integrity and system compliance  

### Implementation Summary
Delivered comprehensive loop metadata audit system with TypeScript-based automation that analyzes all 55 loop files for data quality issues.

### Key Achievements
- **Comprehensive Analysis**: Automated scanning of entire `/runtime/loops/` collection
- **Multi-dimensional Validation**: Metadata fields, required sections, canonical values
- **Detailed Reporting**: Statistics, distributions, file-by-file analysis with actionable recommendations
- **Orphan Detection**: Identification of artefacts not assigned to canonical workstreams
- **Performance**: ~2 second execution for full collection analysis

### Technical Deliverables
1. **Audit Script**: `scripts/audit-loop-metadata.ts` with modular TypeScript architecture
2. **Validation Engine**: Rules for required fields, sections, and canonical value compliance
3. **Report Generator**: Comprehensive markdown report with statistics and recommendations
4. **Error Handling**: Graceful parsing failures with detailed error reporting

### Business Value
- **Data Quality Visibility**: 80% of files identified with metadata issues requiring attention
- **Compliance Support**: Enables adherence to Ora Alignment Protocol requirements
- **Improved Discoverability**: Better filtering and search capabilities through consistent metadata
- **Maintenance Automation**: Repeatable process for ongoing data quality monitoring

### Critical Findings
- **Field Completeness**: uuid (91%), title (93%), phase (84%), workstream (85%)
- **Structural Issues**: 17 files missing required sections (Purpose, Objectives)
- **Orphaned Artefacts**: 8 files using non-canonical workstreams
- **Quality Score**: Only 20% of files fully compliant with schema requirements

### Future Opportunities
1. **Automated Remediation**: Extend audit to fix simple issues automatically
2. **UI Integration**: Display audit results in system dashboard for real-time monitoring
3. **Scheduled Audits**: Regular automated execution with alerting for quality degradation
4. **Historical Analytics**: Trend analysis of data quality improvements over time
5. **Custom Validation**: User-configurable rules for domain-specific requirements

This capability provides essential infrastructure for maintaining high-quality metadata across the loop collection, supporting better system integrity and user experience through improved filtering and discovery.

---

## Appendix: Future System Opportunities, Safeguards & Consultative Slices

The following roadmap areas are maintained for strategic consultation, future expansion, and resilience. They are not yet scheduled but are explicit options for system growth, governance, or robustness.

### Feedback & Retrospective Loops
- Project: Retrospective & Feedback Loops
    - Task: Capture and analyze human/Ora interactions
    - Task: Continuous feedback-driven improvement cycle
    - Task: Regular system self-assessment and roadmapping

### Cross-Workstream Cohesion
- Project: Semantic Cohesion Across Workstreams
    - Task: Synthesize, align, and reason across multiple workstreams/programs
    - Task: System suggestions for overlap, collaboration, and duplication

### Analytics & Metrics
- Project: Usage Dashboards & Health Reports
    - Task: Artefact and interaction analytics
    - Task: Adoption, engagement, performance, and LLM usage/cost tracking

### Mobile/Accessibility
- Project: Responsive UI & Accessibility
    - Task: Mobile and tablet design/adaptation
    - Task: Accessibility audits, low-vision and keyboard navigation modes

### Automation & Notification
- Project: Automated Signal & Notification System
    - Task: Reminder and alert engine for artefacts and projects
    - Task: Workflow automation via signals and triggers

### Policy, Compliance & Security
- Project: Security, Privacy & Compliance Review
    - Task: Security audit, permission and access management
    - Task: Privacy policy documentation, data residency

### External Integration & API Exposure
- Project: API Exposure & 3rd Party Integration
    - Task: Public API, webhooks, and external ecosystem connectors

### Learning, Documentation & Onboarding
- Project: Docs, Onboarding & In-App Tutorials
    - Task: In-app documentation, help, and onboarding flows
    - Task: User/admin training materials

### Disaster Recovery & Data Resilience
- Project: Disaster Recovery & Backup
    - Task: Data backup, restore, and recovery simulation
    - Task: Failure mode and edge case testing

---

This appendix ensures the Ora roadmap remains systems-oriented, adaptable, and future-proof, with all major opportunities and safeguards explicit for ongoing consultation and evolution.