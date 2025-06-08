---
title: UI Data Source Audit Report
created: 2025-12-13
tags: [audit, ui, data-sources, architecture, documentation]
---

# UI Data Source Audit Report

## Executive Summary

This audit examines the data source logic for four key UI components in the Ora system:
1. **System View** - Overview of system phases and loops
2. **System Docs** - Documentation browser and reader
3. **Phase Document** - Detailed phase and loop viewer
4. **Task Board** - Task management interface

## Key Findings

- **✅ All components use live file data** - No hardcoded demo data found
- **✅ Archive files are properly isolated** - Archive directories exist but are not included in UI data loading
- **⚠️ No file system change detection** - Components don't automatically reload when underlying files change
- **⚠️ No explicit roadmap.md linking** - Data loaders scan all files without checking roadmap references

---

## Component Analysis

### 1. System View

**Component:** `src/ui/react-app/components/SystemView.tsx`  
**API Endpoint:** `/api/roadmap` (`src/ui/react-app/app/api/roadmap/route.ts`)

#### Data Sources
- **Primary Source:** `/runtime/system_roadmap.yaml` - Phase definitions and metadata
- **Loop Content:** `/runtime/loops/*.md` - Individual loop files
- **Phase Content:** `/runtime/phases/phase-{number}.md` - Phase documentation (optional)

#### Loading Logic
1. Reads phase structure from YAML roadmap file
2. For each phase, loads associated loop files based on:
   - Explicitly listed loops in YAML `loops` field
   - Fallback: Scans all loop files for matching `phase` metadata
3. Enriches loop data with file content and metadata parsing
4. Filters out invalid/unreadable loop files gracefully

#### Archive File Handling
- **✅ EXCLUDED:** Archive files in `/runtime/loops/archive/` are not included
- **Mechanism:** Direct file path construction ignores archive subdirectories

#### Demo/Hardcoded Data
- **✅ NONE FOUND:** All data comes from live filesystem
- **Validation:** Component includes schema validation but no fallback demo data

#### Roadmap Linking
- **⚠️ MIXED APPROACH:** 
  - Primary: Uses explicit YAML-defined loop associations
  - Fallback: Scans all loop files for phase references
  - Does not validate loops are referenced in `roadmap.md`

#### File System Change Detection
- **❌ NO AUTO-RELOAD:** Manual refresh required to see file changes
- **Mechanism:** Data fetched only on component mount via `useEffect`

---

### 2. System Docs

**Component:** `src/ui/react-app/components/SystemDocs.tsx`  
**API Endpoint:** `/api/system-docs` (`src/ui/react-app/app/api/system-docs/route.ts`)

#### Data Sources
- **Primary Source:** `/runtime/docs/*.md` - All markdown files in docs directory
- **File Metadata:** File system stats (size, modification time)
- **Content Parsing:** YAML frontmatter and markdown content

#### Loading Logic
1. Lists all `.md` files in `/runtime/docs/`
2. Extracts metadata from frontmatter (title, tags)
3. Provides file browser interface with content rendering
4. Renders markdown to HTML using `marked` library

#### Archive File Handling
- **✅ EXCLUDED:** No archive subdirectories found in `/runtime/docs/`
- **Scope:** Only processes direct files in docs directory

#### Demo/Hardcoded Data
- **✅ NONE FOUND:** All data comes from live filesystem
- **Error Handling:** Graceful handling of missing/unreadable files

#### Roadmap Linking
- **❌ NO VALIDATION:** Loads all docs files regardless of roadmap references
- **Approach:** Directory-based loading without cross-referencing

#### File System Change Detection
- **❌ NO AUTO-RELOAD:** Manual refresh required to see file changes
- **Note:** File list fetched on mount, content fetched per selection

---

### 3. Phase Document

**Component:** `src/ui/react-app/components/PhaseDocView.tsx`  
**API Endpoint:** `/api/roadmap` (same as System View)

#### Data Sources
- **Shared with System View:** Same data loading infrastructure
- **Primary Source:** `/runtime/system_roadmap.yaml` + `/runtime/loops/*.md`
- **Phase Content:** `/runtime/phases/phase-{number}.md`

#### Loading Logic
- Identical to System View data loading
- Additional filtering and organization by loop type (planning, execution, retrospective)
- Enhanced with comprehensive filtering UI (workstream, status, type, tags)

#### Archive File Handling
- **✅ EXCLUDED:** Same exclusion logic as System View

#### Demo/Hardcoded Data
- **✅ NONE FOUND:** All data from live filesystem

#### Roadmap Linking
- **⚠️ SAME AS SYSTEM VIEW:** Mixed approach with YAML + scanning

#### File System Change Detection
- **❌ NO AUTO-RELOAD:** Manual refresh required

---

### 4. Task Board

**Component:** `src/ui/react-app/components/TaskBoard.tsx`  
**API Endpoint:** `/api/plan-tasks` (`src/ui/react-app/app/api/plan-tasks/route.ts`)

#### Data Sources
- **Primary Source:** `/runtime/workstreams/roadmap/workstream_plan.md`
- **Task Format:** Markdown sections with structured task lists
- **Backup Location:** `/runtime/backups/` (for safety)

#### Loading Logic
1. Parses markdown file for task sections:
   - `### User-Defined Tasks`
   - `### Ora-Suggested Tasks`
2. Extracts task metadata from structured markdown format
3. Provides full CRUD operations with automatic backup creation

#### Archive File Handling
- **✅ EXCLUDED:** No archive directories scanned
- **Focus:** Single file source with backup mechanism

#### Demo/Hardcoded Data
- **✅ NONE FOUND:** All tasks from live plan file
- **Fallback:** Returns empty array if plan file doesn't exist

#### Roadmap Linking
- **⚠️ INDEPENDENT:** Tasks exist in separate plan file, not validated against roadmap
- **Integration:** Task promotion can create new loops but no validation

#### File System Change Detection
- **❌ NO AUTO-RELOAD:** Manual refresh required
- **Write Safety:** Includes backup mechanism and sanity checks

---

## Summary Matrix

| Component | Data Source | Archive Included | Demo Data | Roadmap Links | Auto-Reload |
|-----------|-------------|------------------|-----------|---------------|-------------|
| System View | `/runtime/system_roadmap.yaml` + `/runtime/loops/*.md` | ❌ Excluded | ✅ None | ⚠️ Mixed | ❌ No |
| System Docs | `/runtime/docs/*.md` | ❌ Excluded | ✅ None | ❌ No | ❌ No |
| Phase Document | Same as System View | ❌ Excluded | ✅ None | ⚠️ Mixed | ❌ No |
| Task Board | `/runtime/workstreams/roadmap/workstream_plan.md` | ❌ Excluded | ✅ None | ❌ Independent | ❌ No |

---

## Recommendations

### 1. File System Change Detection
**Priority: Medium**
- Implement WebSocket or polling-based file change detection
- Automatically refresh UI when underlying files change
- Particularly important for collaborative editing scenarios

### 2. Roadmap-Driven Loading
**Priority: High**
- Enhance data loaders to validate against `roadmap.md` references
- Implement explicit linking between roadmap and loaded content
- Add warnings for orphaned files not referenced in roadmap

### 3. Archive Safety Validation
**Priority: Low**
- Add explicit tests to ensure archive directories are never included
- Implement path validation to prevent accidental archive loading
- Document archive exclusion patterns clearly

### 4. Data Consistency Checks
**Priority: Medium**
- Add cross-component data validation
- Ensure task promotion creates properly linked loop files
- Validate phase-loop associations match roadmap structure

### 5. Performance Optimization
**Priority: Low**
- Implement caching for frequently accessed file content
- Add lazy loading for large loop content
- Consider pagination for large file lists

---

## Compliance Assessment

### Ora Alignment Protocol Compliance
- **✅ Live File Sources:** All components use live file data
- **✅ Archive Isolation:** Archived files properly excluded
- **⚠️ Roadmap Integration:** Partial compliance with roadmap-driven approach
- **❌ Auto-Refresh:** Manual refresh required for file changes

### Data Integrity
- **✅ No Demo Data:** All UI components use live system data
- **✅ Error Handling:** Graceful handling of missing/invalid files
- **✅ Backup Safety:** Task operations include backup mechanisms
- **✅ Schema Validation:** Loop content validated against expected structure

---

## Conclusion

The UI data source architecture is fundamentally sound with **live file-based data loading** and **proper archive exclusion**. The main areas for improvement are **file system change detection** and **stronger roadmap-driven validation**. No critical issues were found regarding demo data contamination or archive file inclusion.

The system demonstrates good separation of concerns with dedicated API endpoints and consistent error handling patterns across all components. 