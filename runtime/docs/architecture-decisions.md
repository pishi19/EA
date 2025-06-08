---
title: Ora Architecture Decisions Log
created: 2025-06-08
last_updated: 2025-06-08
tags: [system, architecture, decisions, documentation]
---

# Architecture Decisions Log

## [2025-06-08] Storage Evolution: Markdown vs Database

- **Decision:** Continue using markdown for artefacts until real mutation or source-integration issues arise; migrate only artefact types that prove unsound in markdown.
- **Rationale:** Human readability, traceability, and GPT-compatibility take precedence, but will yield to operational requirements under stress.
- **Trigger:** External source integration (e.g., Gmail, Slack) will drive DB adoption as mutation consistency requires.
- **Action:** All future DB migrations must be documented here, with evidence and cross-references to the affected artefacts.
- **UI Integration:** This log is to be viewable and editable directly in the UI; no action/mutation may occur without corresponding entry here.

---

## [2025-12-13] System Docs React Migration & Architecture Alignment

- **Decision:** Migrate "System Docs" feature from Streamlit to canonical React UI; establish React as the primary UI architecture
- **Rationale:** Align with canonical Next.js React application structure; eliminate redundant Streamlit components; ensure consistent UI/UX patterns across the system; improve maintainability and performance
- **Trigger:** Recognition that React UI (`src/ui/react-app/`) is the canonical interface; Streamlit implementation was architecturally inconsistent and created technical debt
- **Action:** 
  - Removed: `src/ui/pages/2_System_Docs.py` (Streamlit implementation)
  - Created: React API route (`app/api/system-docs/route.ts`) with markdown parsing, frontmatter support, and file metadata
  - Created: React component (`components/SystemDocs.tsx`) with modern UI, file selection, content rendering, and download capability
  - Integrated: Navigation link in main app layout
- **UI Integration:** Seamless integration with existing React UI; consistent styling with shadcn/ui components; enhanced UX with sidebar navigation, metadata display, and responsive design; all `/runtime/docs/` files accessible with improved performance

## [2025-12-13] Workstream Filtering UI Enhancement

- **Decision:** Implement comprehensive workstream filtering across all loop views; add missing workstream filtering to PhaseDocView component to match existing SystemView functionality
- **Rationale:** Ensure consistent user experience across all loop interfaces; enable workstream-based organization and filtering of loops, tasks, and artefacts; leverage existing workstream metadata from loop frontmatter; maintain filtering pattern consistency
- **Trigger:** User request for workstream filtering dropdown to organize loops by workstream; discovery that SystemView had workstream filtering but PhaseDocView was missing this capability
- **Action:**
  - Enhanced: `PhaseDocView.tsx` with workstream state management, allWorkstreams computation, workstream filtering logic, and UI dropdown
  - Updated: Grid layout from 5 to 6 columns to accommodate new workstream filter
  - Ensured: API routes properly surface workstream metadata from `/api/roadmap` endpoint
  - Validated: TypeScript compilation and build success with no regressions
- **UI Integration:** Workstream filtering now consistently available in both SystemView and PhaseDocView components; follows existing filter patterns (Status, Type, Tags, Sort); integrates with shadcn/ui Select component; responsive grid layout maintains UX quality

## [2025-12-13] Semantic Chat Demo Elevation & Primary Navigation Enhancement

- **Decision:** Elevate Contextual Chat Demo to top-level navigation as "Semantic Chat" and implement comprehensive artefact filtering capabilities
- **Rationale:** Semantic chat functionality represents a core architectural component that deserves primary navigation prominence; comprehensive filtering enables better artefact organization and contextual access; real-time filtering enhances user experience and chat context relevance; aligns with system goal of surfacing key functionality prominently
- **Trigger:** User requirement to elevate contextual chat architecture demo to top-level page with full artefact filtering (workstream, program, project equivalents); need for primary navigation accessibility of semantic chat capabilities
- **Action:**
  - Enhanced: Navigation in `layout.tsx` to include "Semantic Chat" as primary menu item
  - Implemented: Comprehensive filtering system in contextual chat demo with workstream, phase (program), tag (project), and status filters
  - Added: Multi-select tag filtering using existing MultiSelect component
  - Created: Real-time filter state management with visual indicators and filtered count display
  - Integrated: Filter reset functionality and no-results handling for enhanced UX
  - Ensured: Filter state affects both loop display and chat context selection
- **UI Integration:** Semantic Chat Demo elevated to primary navigation with seamless integration; comprehensive filtering follows established patterns from SystemView and PhaseDocView; MultiSelect component integration successful; real-time filtering with preserved state; responsive design maintains UX quality across filter combinations; build optimized as static prerendered content (7.81 kB)

## [2025-12-13] Comprehensive Artefact Filtering Architecture Implementation

- **Decision:** Implement complete multi-dimensional artefact filtering system in Semantic Chat Demo with workstream, program (phase-based), and project (tag-based) filtering capabilities following established UI design patterns
- **Rationale:** Enable efficient navigation through 53+ artefacts using semantic hierarchical categories; provide consistent filtering experience across all UI views; establish scalable filtering architecture for growing artefact collections; support independent and combined filter operations for maximum flexibility; enhance user experience with real-time updates and clear visual feedback
- **Trigger:** User requirement for full artefact filtering with workstream, program, project equivalents; need for comprehensive filtering controls that work independently and in combination; requirement to follow established UI patterns from SystemView and PhaseDocView components
- **Action:**
  - Complete rewrite: `contextual-chat-demo/page.tsx` with comprehensive filtering state management (workstream, program/phase, project/tags, status, sorting)
  - Implemented: Real-time filter computation using useMemo for optimal performance with dynamic filtering options derived from actual artefact metadata
  - Created: Responsive 6-column grid filtering interface with consistent shadcn/ui Select components
  - Added: Multiple sorting options (newest first, score-based, alphabetical, workstream-based) with real-time application
  - Enhanced: Artefact display with type badges, metadata display, and hover effects for improved UX
  - Integrated: Clear filter reset functionality and comprehensive no-results handling
  - Ensured: Dynamic count displays showing total artefacts, filtered results, available workstreams, and programs
- **UI Integration:** Sophisticated filtering interface with responsive grid layout; independent filter operation with "All" defaults; real-time artefact count updates and filter state management; comprehensive sort options with immediate visual feedback; enhanced artefact cards with type badges (Planning, Execution, Retrospective) and structured metadata display; filter reset functionality for easy navigation; establishes robust filtering architecture pattern for future semantic UI enhancements and artefact management systems

## [YYYY-MM-DD] Decision/Change Title

- **Decision:** ...
- **Rationale:** ...
- **Trigger:** ...
- **Action:** ...
- **UI Integration:** ...

## ADR-008: Loop Metadata Audit System (2025-06-08)

**Status**: ✅ IMPLEMENTED  
**Context**: Need for comprehensive audit of loop metadata to ensure data quality and Ora Alignment Protocol compliance  
**Impact**: Data Quality & System Integrity  

### Problem Statement
The loop collection had grown to 55+ files with inconsistent metadata quality, missing required fields, and non-canonical workstream assignments. This created issues with:
- Filtering and discovery in the UI
- Compliance with the Ora Alignment Protocol
- Data integrity and consistency
- Orphaned artefacts not properly categorized

### Decision: Automated Metadata Audit System

**Architecture**: TypeScript-based audit script with comprehensive validation  
**Location**: `scripts/audit-loop-metadata.ts`  
**Output**: Detailed markdown report in `/runtime/logs/`  

### Technical Design
1. **Modular Architecture**: Separate functions for scanning, parsing, validation, and reporting
2. **YAML Frontmatter Parsing**: Using `gray-matter` library for consistent parsing
3. **Multi-dimensional Validation**: Required fields, sections, canonical values, data types
4. **Comprehensive Reporting**: Statistics, distributions, file-by-file analysis with recommendations

### Validation Rules Implemented
- **Required Metadata Fields**: uuid, title, phase, workstream, status, tags, created, origin
- **Required Sections**: Purpose, Objectives, Tasks, Execution Log, Memory Trace
- **Canonical Workstreams**: system-integrity, workstream-ui, reasoning, memory
- **Canonical Phases**: 7.0-10.2 range with proper numbering
- **Canonical Statuses**: planned, in_progress, complete, on_hold, cancelled

### Key Results from Initial Audit
- **55 files analyzed** with 80% having metadata issues
- **Field completeness**: uuid (91%), title (93%), phase (84%), workstream (85%)
- **8 orphaned artefacts** using non-canonical workstreams
- **17 files missing required sections** (31% of collection)

### Benefits
1. **Data Quality Visibility**: Clear metrics on metadata health
2. **Automated Detection**: Systematic identification of issues vs. manual review
3. **Prioritized Remediation**: Ranked recommendations for improvement
4. **Ongoing Monitoring**: Repeatable audit process for maintenance
5. **Compliance Assurance**: Supports Ora Alignment Protocol adherence

### Implementation Considerations
- **Read-only Operation**: Audit only, no automatic mutations to preserve data integrity
- **Performance**: ~2 second execution for entire collection
- **Extensibility**: Easy to add new validation rules or fields
- **Error Handling**: Graceful failure with detailed error reporting

### Integration Points
- **Output Integration**: Report accessible through file system and potential UI integration
- **Build Process**: Can be integrated into CI/CD for automated quality checks
- **Development Workflow**: Supports manual execution for data quality validation

### Future Enhancements
1. **Automated Remediation**: Option to fix simple issues automatically
2. **UI Integration**: Display audit results in system dashboard
3. **Scheduled Audits**: Regular automated execution with alerting
4. **Custom Validation Rules**: User-configurable validation criteria
5. **Historical Tracking**: Trend analysis of data quality over time

This decision establishes a foundation for maintaining high-quality metadata across the entire loop collection, supporting better discoverability and system integrity.

## ADR-009: Roadmap Hierarchical Structure (2025-06-08)

**Status**: ✅ IMPLEMENTED  
**Context**: Need for systematic organization of roadmap phases with explicit program/project/task hierarchy  
**Impact**: Planning Structure & Project Management  

### Problem Statement
The existing roadmap structure lacked hierarchical organization, making it difficult to:
- Track progress at different levels of granularity
- Understand relationships between related work items
- Provide clear status visibility for programs, projects, and tasks
- Establish consistent patterns for future phase planning

### Decision: Hierarchical Program/Project/Task Structure

**Architecture**: Three-level hierarchy with explicit numbering scheme  
**Pattern**: Phase X → Project X.Y → Task X.Y.Z  
**Implementation**: Enhanced roadmap.md with structured breakdown  

### Technical Design
1. **Program Level**: Major phase initiatives (e.g., Phase 11 – Artefact Hierarchy and Filtering)
2. **Project Level**: Logical groupings of related tasks (e.g., Project 11.1: Artefact Schema and Canonicalization)
3. **Task Level**: Specific deliverables with clear outcomes (e.g., Task 11.1.1: Design canonical artefact schema)

### Phase 11 Implementation Structure
- **Program**: Phase 11 – Artefact Hierarchy and Filtering
  - **Project 11.1**: Artefact Schema and Canonicalization (COMPLETE)
    - Task 11.1.1: Design canonical artefact schema (COMPLETE)
    - Task 11.1.2: Document schema in system docs (COMPLETE)
  - **Project 11.2**: Semantic Chat Demo Filtering (COMPLETE)
    - Task 11.2.1: Implement filtering logic (COMPLETE)
    - Task 11.2.2: Integrate UI filter components (COMPLETE)
    - Task 11.2.3: Test filtering across artefact types (COMPLETE)
  - **Project 11.3**: Legacy Data Cleanup (IN PROGRESS)
    - Task 11.3.1: Audit legacy loop files (COMPLETE)
    - Task 11.3.2: Migrate compliant artefacts (IN PROGRESS)
    - Task 11.3.3: Archive non-compliant artefacts (PLANNED)

### Status Tracking Framework
- **✅ COMPLETE**: Work finished with deliverables validated
- **🔄 IN PROGRESS**: Active development with defined scope
- **⏳ PLANNED**: Future work with dependencies identified
- **❌ BLOCKED**: Work stopped pending resolution

### Benefits
1. **Granular Tracking**: Progress visibility at program, project, and task levels
2. **Dependency Management**: Clear relationships between work items
3. **Resource Planning**: Better allocation through structured breakdown
4. **Pattern Consistency**: Reusable template for future phases
5. **Status Clarity**: Unified tracking across all levels of work

### Implementation Considerations
- **Numbering Scheme**: Consistent X.Y.Z pattern for easy reference
- **Status Preservation**: Existing completion states maintained during migration
- **Deliverable Tracking**: Each task linked to specific outputs and artifacts
- **Cross-Reference**: Integration with existing loop and documentation systems

### Integration Points
- **Documentation**: Links to specific deliverables in `/runtime/logs/` and `/runtime/docs/`
- **UI Access**: Roadmap structure accessible through system documentation interface
- **Audit Trail**: Change log entries tracking hierarchical structure implementation
- **Future Phases**: Template established for consistent organization

### Maintenance Protocol
1. **Regular Updates**: Status changes tracked at appropriate granularity level
2. **Completion Criteria**: Clear definition of done for each level
3. **Documentation**: All changes logged in system update protocol checklist
4. **Review Cycles**: Periodic assessment of structure effectiveness

This decision establishes a foundation for systematic project management within the Ora system, enabling better planning, tracking, and execution of complex multi-phase initiatives.
