---
title: Ora Architecture Decisions Log
created: 2025-06-08
last_updated: 2025-06-08
tags: [system, architecture, decisions, documentation]
---

# Architecture Decisions Log

## [2025-12-13] Roadmap-Referenced Artefact Alignment & Live Directory Enforcement

- **Decision:** Archive all remaining loop artefacts from root directory that are not explicitly referenced in `/runtime/docs/roadmap.md` as required for current live execution; enforce Ora Alignment Protocol requirement for roadmap-driven artefact management
- **Rationale:** Maintain clean separation between live and archived content; ensure only currently needed artefacts remain in live directories; complete the canonical schema foundation established in previous archival phases; eliminate confusion about active vs. historical artefacts
- **Trigger:** Discovery of 6 loop files in root directory during UI data source audit; enforcement of Ora Alignment Protocol requirement that only roadmap-referenced artefacts should remain in live directories
- **Action:** 
  - Archived: 6 loop files from root directory to `/runtime/loops/archive/` (loop-2025-08-17-memory-driven-reasoning.md, loop-2025-08-15-memory-trace-initiation.md, loop-2025-08-13-ui-integration.md, loop-2025-08-12-task-ui-behavior-test.md, loop-2025-08-10-task-mutation-from-ui.md, loop-2025-08-08-test-infrastructure-diagnosis.md)
  - Updated: Archive README.md with new archival rationale and file inventory
  - Logged: Action in all required protocol documents (feedback-journal.md, architecture-decisions.md, system-update-protocol-checklist.md, .cursor/prompts/manifest.yaml)
- **UI Integration:** All archived files remain accessible through system documentation interface; live directories now contain only roadmap-sequenced artefacts; complete compliance with canonical artefact management requirements

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

## [2025-12-13] Semantic Chat Classic Restoration & Embedded Chat Architecture

- **Decision:** Restore previously lost "Semantic Chat Classic" page with embedded, expandable context-aware chat for each artefact; implement dual semantic chat interface pattern with current filtering demo and restored embedded chat architecture
- **Rationale:** Preserve both interface paradigms - current filtering-focused demo and restored embedded chat functionality; embedded chat provides direct context-specific interaction with each artefact; expandable/collapsible design scales efficiently with large artefact collections; maintains semantic anchoring of chat to specific loop context and file structure; supports persistent chat history in loop files through ## 💬 Chat sections
- **Trigger:** User requirement to restore lost embedded chat functionality without replacing current implementation; need for context-aware chat interface where conversations are scoped to individual artefacts; requirement for persistent chat history integration with loop file structure and Memory Trace/Execution Log functionality
- **Action:**
  - Created: `semantic-chat-classic/page.tsx` with embedded ChatPane components for each filtered artefact
  - Implemented: Individual expand/collapse controls per artefact with bulk expand/collapse functionality
  - Created: `components/ui/collapsible.tsx` to support expandable chat interface
  - Enhanced: Navigation to include "Semantic Chat Classic" alongside existing "Semantic Chat"
  - Integrated: Full filtering capabilities with embedded chat state preservation across filter operations
  - Ensured: Contextual chat scoped to loop UUID and file path with persistent history in ## 💬 Chat sections
- **UI Integration:** Semantic Chat Classic page provides artefact list/card view with embedded ChatPane components; individual chat expand/collapse controls maintain clean interface scaling; bulk controls enable efficient navigation through large collections; filtering preservation maintains context across artefact discovery and chat interaction; persistent chat history anchored to loop files enables continuity and Memory Trace integration; dual semantic chat pattern supports both discovery-focused (current demo) and interaction-focused (classic) workflows

## [2025-12-13] Workstream Filter Demo Implementation

- **Decision:** Create new standalone filtering component implementing explicit Workstream → Program → Project → Task hierarchy using canonical YAML schema and roadmap structure
- **Rationale:** Establish dedicated demonstration of hierarchical filtering capability without mutating existing Contextual Chat Architecture Demo; implement canonical schema structure (workstream, program/phase, project/tags, task/artefact) as specified in Ora Alignment Protocol; provide comprehensive artefact filtering using live data from roadmap-referenced artefacts only
- **Trigger:** User requirement to create new page implementing explicit hierarchy: "Workstream → Program → Project → Task (Artefact)" using canonical YAML schema; requirement to preserve existing Contextual Chat Architecture Demo page; need for standalone filtering demonstration following Ora Alignment Protocol
- **Action:**
  - Created: `app/workstream-filter-demo/page.tsx` implementing hierarchical cascade filtering with workstream (frontmatter), program (phase-based), project (tag-based), and status filtering
  - Added: Navigation link in `layout.tsx` as "Workstream Filter Demo" alongside existing pages
  - Implemented: Real-time filter computation with comprehensive metadata display including UUID, origin, scores, creation dates, and full tag visualization
  - Integrated: Summary statistics showing total artefacts, filtered results, available workstreams, and programs with dynamic counts
  - Ensured: Component uses existing API routes (/api/roadmap) and follows established UI patterns with shadcn/ui components
- **UI Integration:** New page accessible via primary navigation; hierarchical filtering demonstrates canonical schema structure with live roadmap data; comprehensive artefact cards show all metadata dimensions; filter controls use established UI patterns; responsive design maintains quality across filter combinations; real-time updates with clear visual feedback and filter reset functionality; no mutations to existing pages or artefacts

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

## ADR-010: Legacy Artefact Archival Strategy (2025-06-08)

**Status**: ✅ IMPLEMENTED  
**Context**: Need for systematic cleanup of legacy loop and task files to establish canonical artefact schema foundation  
**Impact**: Data Architecture & Quality Management  

### Problem Statement
The system contained 54 legacy artefact files (52 loops, 2 tasks) with inconsistent metadata structures that created issues with:
- Filtering and discovery in the UI systems
- Compliance with established canonical schema requirements
- Data integrity and systematic organization
- Integration with hierarchical roadmap structure

### Decision: Archive-First Legacy Data Cleanup

**Strategy**: Preserve all legacy content through archival while establishing clean foundation  
**Implementation**: Create `/archive/` subdirectories within existing structure  
**Preservation**: Maintain complete historical record without content modification  

### Technical Design
1. **Archive Structure**: Create `/runtime/loops/archive/` and `/runtime/tasks/archive/` directories
2. **Content Preservation**: Move all files without modification to maintain historical integrity
3. **Documentation**: Comprehensive README.md files documenting archive rationale and future requirements
4. **Schema Reference**: Clear links to canonical schema documentation and requirements

### Legacy Files Archived

#### Loops Archive (52 files):
- **System Integrity**: 16 files related to testing, validation, and system hardening
- **Workstream UI**: 18 files covering UI development, testing, and integration
- **Reasoning**: 9 files focused on memory, reasoning, and task generation
- **Memory**: 2 files addressing memory trace and reasoning systems
- **Orphaned**: 7 files with missing or non-canonical workstream assignments

#### Tasks Archive (2 files):
- **task-loop-card-component.md**: LoopCard component with embedded chat functionality
- **task-chat-pane-update.md**: Chat pane contextual functionality updates

### Archive Documentation Standards
Each archive directory includes comprehensive README.md with:
- **Archive Summary**: Date, time, reason, and file count
- **Rationale**: Detailed explanation of issues and cleanup necessity  
- **Canonical Schema**: Complete specification for future artefact creation
- **File Inventory**: Table with filename, UUID, workstream, status, and creation date
- **Requirements**: Clear guidelines for future artefact creation and validation

### Benefits
1. **Clean Foundation**: Establishes clear baseline for canonical schema implementation
2. **Historical Preservation**: Maintains complete system evolution record
3. **Quality Improvement**: Enables consistent metadata and structure going forward
4. **Integration Support**: Facilitates proper roadmap hierarchy implementation
5. **Audit Compliance**: Provides clear trail of cleanup decisions and rationale

### Future Architecture Implications
- **No Standalone Tasks**: All task work integrated into roadmap hierarchy
- **Schema Validation**: Mandatory compliance checking before artefact creation
- **Workstream Assignment**: Required canonical workstream categorization
- **Hierarchical Structure**: Program/Project/Task organization from roadmap
- **Documentation Standards**: Complete required sections with meaningful content

### Implementation Considerations
- **Content Immutability**: Archived files preserved exactly as created
- **Cross-Reference Integrity**: Archive documentation includes full inventory
- **Schema Evolution**: Clear path from legacy to canonical structure
- **UI Integration**: Archive accessible through system documentation interface
- **Audit Trail**: Complete logging in all required protocol documents

### Maintenance Protocol
1. **Archive Immutability**: No modifications to archived content
2. **Documentation Updates**: README.md files updated as schema evolves
3. **Reference Links**: Maintain accurate links to canonical documentation
4. **Access Control**: Archive content read-only for historical reference
5. **Migration Tracking**: Clear documentation of evolved functionality integration

This decision establishes a foundation for systematic artefact management while preserving the complete historical evolution of the Ora system for future reference and analysis.
