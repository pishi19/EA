---
title: API Hierarchy Parsing Audit Report
created: 2025-12-13
type: audit
category: api-architecture
status: complete
---

# API Hierarchy Parsing Audit Report

## Executive Summary

This audit examines how the Ora system's API endpoints parse and surface the artefact hierarchy: **Workstream → Program → Project → Task (Artefact)**. Two primary endpoints handle artefact data with different approaches and capabilities.

---

## API Endpoint Analysis

### 1. `/api/demo-loops` (Primary for Workstream Filter Demo)

**Location**: `src/ui/react-app/app/api/demo-loops/route.ts`

#### Hierarchy Parsing Logic

| Level | Source | Parsing Method | Fallback Logic |
|-------|--------|----------------|----------------|
| **Workstream** | `frontmatter.workstream` | Direct YAML field read | `'unknown'` if missing |
| **Program** | `frontmatter.phase` | Direct YAML field read | `'0.0'` if missing |
| **Project** | `frontmatter.tags[]` | Array of tag strings | `[]` empty array if missing |
| **Task/Artefact** | File itself | File-based discovery | Loop filename as ID |

#### Data Loading Strategy
- **Discovery Method**: File system scan of `/runtime/loops/`
- **Filter**: Files starting with `loop-` and ending with `.md`
- **Roadmap Integration**: ❌ **None** - loads all files present in directory
- **Validation**: ❌ **None** - no canonical schema enforcement

#### Hierarchy Flattening
```typescript
interface LoopMetadata {
  workstream: string;    // Direct from frontmatter.workstream
  phase: string;         // Direct from frontmatter.phase  
  tags: string[];        // Direct from frontmatter.tags
  // No explicit project or program fields
}
```

**Current Issues**:
- No explicit `project` field - relies on tag interpretation
- No canonical workstream validation 
- No roadmap cross-referencing
- Loads orphaned/non-roadmap artefacts

---

### 2. `/api/roadmap` (Used by System View, Phase Document)

**Location**: `src/ui/react-app/app/api/roadmap/route.ts`

#### Hierarchy Parsing Logic

| Level | Source | Parsing Method | Fallback Logic |
|-------|--------|----------------|----------------|
| **Workstream** | `frontmatter.workstream` | Direct YAML field read | `'unassigned'` if missing |
| **Program** | `frontmatter.phase` + roadmap YAML | Cross-referenced with roadmap | Phase scanning if no YAML ref |
| **Project** | `frontmatter.tags[]` | Array interpretation | `[]` empty array |
| **Task/Artefact** | Roadmap YAML + file scan | Roadmap-defined then discovery | Discovery fallback |

#### Data Loading Strategy
- **Discovery Method**: Roadmap YAML + file system fallback
- **Primary Source**: `/runtime/system_roadmap.yaml` 
- **Roadmap Integration**: ✅ **Full** - starts with roadmap-defined loops
- **Validation**: ⚠️ **Partial** - validates existence but not schema

#### Hierarchy Structure
```typescript
interface EnrichedLoop {
  workstream: string;    // Direct from frontmatter.workstream
  phase: number;         // Parsed from frontmatter.phase
  tags: string[];        // Direct from frontmatter.tags
  // Programs come from roadmap YAML phases
  // Projects inferred from tags
}
```

**Current Issues**:
- ❌ **ENOENT Errors**: References archived loop files
- ⚠️ **Mixed Discovery**: Roadmap + file scan creates inconsistency
- ❌ **No Project Schema**: Projects still inferred from tags

---

## Workstream Filter Demo Implementation

**Location**: `src/ui/react-app/app/workstream-filter-demo/page.tsx`

### Hierarchical Filter Logic

#### Workstream Level
```typescript
const CANONICAL_WORKSTREAMS = [
    'workstream-ui', 'system-integrity', 'reasoning', 'memory'
];

// Filters artefacts by canonical workstream inclusion
const availableWorkstreams = artefacts.filter(a => 
    CANONICAL_WORKSTREAMS.includes(a.workstream)
);
```

#### Program Level 
```typescript
const CANONICAL_PROGRAMS = {
    'workstream-ui': ['Phase 11.1', 'Phase 11.2', 'Phase 10.1'],
    'system-integrity': ['Phase 10.2', 'Phase 10.3', 'Phase 9.1'],
    // ...
};

// Maps phase field to "Phase X.Y" format
programs = artefacts.map(a => `Phase ${a.phase}`)
```

#### Project Level
```typescript
const CANONICAL_PROJECTS = {
    'Phase 11.1': ['Artefact Schema and Canonicalization', 'UI Component Architecture'],
    // ...
};

// Falls back to tag-based project inference
projects = artefacts.flatMap(a => a.tags.filter(tag => !tag.startsWith('#')))
```

### Current Filter Hierarchy Issues

1. **Hard-coded Mappings**: Canonical structures defined in UI code
2. **Tag-based Project Inference**: No explicit project field in schema
3. **No API Validation**: Client-side canonical enforcement only
4. **Mixed Discovery**: API provides all artefacts, UI filters canonically

---

## YAML Frontmatter Analysis

### Current Schema (from archived artefacts)
```yaml
---
uuid: loop-2025-09-06-phase-10-wrapup
title: "Phase 10.0 Wrap-Up – Semantic Execution Slice Complete"
phase: 10.0                    # Used as Program identifier
workstream: system-integrity   # Direct workstream field
status: complete
score: 1.0
tags: [wrapup, reflection, architecture, roadmap, chat, task-system]  # Used for Project inference
created: 2025-06-07
origin: closure
summary: |
  Loop summary content...
---
```

### Missing Hierarchy Fields
- ❌ **No explicit `program` field** - inferred from `phase`
- ❌ **No explicit `project` field** - inferred from `tags`
- ❌ **No hierarchical validation** - any values accepted
- ❌ **No canonical cross-referencing** - no roadmap enforcement

---

## Recommendations for Enhancement

### 1. API Schema Enhancement Locations

#### `/api/demo-loops` Enhancement Points
```typescript
// Line 25-40: Add explicit hierarchy fields to LoopMetadata interface
interface LoopMetadata {
  // ... existing fields
  program: string;        // NEW: Explicit program field
  project: string;        // NEW: Explicit project field  
  workstream_canonical: boolean;  // NEW: Canonical validation flag
}

// Line 55-75: Add canonical validation in loadLoopMetadata()
const validateCanonicalHierarchy = (frontmatter: any) => {
  // Add validation logic here
};
```

#### `/api/roadmap` Enhancement Points  
```typescript
// Line 15-35: Add roadmap-enforced hierarchy validation
const validateRoadmapCompliance = async (loopData: any) => {
  // Cross-reference with roadmap structure
};

// Line 105-130: Fix ENOENT errors with archive awareness
const loadWithArchiveFallback = async (loopId: string) => {
  // Try live directory first, then archive
};
```

### 2. Schema Migration Strategy

#### Phase 1: Additive Fields
```yaml
---
# Existing fields (preserved)
phase: 10.0
workstream: system-integrity  
tags: [wrapup, reflection]

# New explicit hierarchy fields  
program: "Phase 10.0 - Scoped Chat Architecture"
project: "System Integration & Execution"
---
```

#### Phase 2: Canonical Validation
- Add API validation against `CANONICAL_WORKSTREAMS`
- Cross-reference programs with roadmap YAML
- Validate project assignments against canonical mappings

### 3. Discovery Logic Enhancement

#### Current (File-based Discovery)
```typescript
// Loads all .md files starting with "loop-"
const files = await fs.readdir(LOOPS_DIR);
const loopFiles = files.filter(file => 
  file.startsWith('loop-') && file.endsWith('.md')
);
```

#### Proposed (Roadmap-driven Discovery)
```typescript
// Load roadmap-referenced artefacts first, then validate
const roadmapArtefacts = await loadRoadmapReferencedArtefacts();
const validatedArtefacts = roadmapArtefacts.filter(validateCanonicalSchema);
const discoveredArtefacts = await discoverAdditionalArtefacts();
return [...validatedArtefacts, ...discoveredArtefacts];
```

---

## Critical Gaps Identified

### 1. No First-Class Project/Program Fields
- **Current**: Programs inferred from `phase`, projects from `tags`
- **Impact**: Lossy hierarchy representation, inconsistent filtering
- **Fix Location**: API schema interfaces + frontmatter parsing

### 2. No Canonical Schema Enforcement  
- **Current**: APIs accept any frontmatter values
- **Impact**: Non-canonical artefacts loaded and filtered
- **Fix Location**: `loadLoopMetadata()` validation functions

### 3. Roadmap Synchronization Issues
- **Current**: `/api/roadmap` references missing archived files
- **Impact**: ENOENT errors, incomplete data loading
- **Fix Location**: Archive-aware file loading in `/api/roadmap`

### 4. Hard-coded UI Mappings
- **Current**: Canonical structures defined in React components
- **Impact**: Schema changes require UI code updates
- **Fix Location**: Move canonical mappings to API or config

---

## Audit Conclusion

The current API hierarchy parsing is **functional but incomplete**. While basic workstream/phase/tag filtering works, the system lacks:

1. **Explicit hierarchy fields** (program/project as first-class schema fields)
2. **Canonical validation** (API-level schema enforcement)  
3. **Roadmap integration** (synchronized artefact discovery)
4. **Archive awareness** (handling of historical vs. live artefacts)

**Next Steps**: Implement explicit hierarchy fields in YAML schema, add API-level canonical validation, and fix roadmap synchronization issues before expanding the filtering system further.

---

## File Locations for Enhancement

| Component | File Path | Enhancement Area |
|-----------|-----------|------------------|
| Demo Loops API | `src/ui/react-app/app/api/demo-loops/route.ts` | Add canonical validation, explicit hierarchy fields |
| Roadmap API | `src/ui/react-app/app/api/roadmap/route.ts` | Fix archive awareness, roadmap sync |
| Type Definitions | `src/ui/react-app/lib/types.ts` | Add program/project fields to interfaces |
| Filter Demo | `src/ui/react-app/app/workstream-filter-demo/page.tsx` | Move canonical mappings to API |
| YAML Engine | `src/ui/react-app/lib/yaml-engine.ts` | Add hierarchy validation rules |

**Priority**: Address explicit hierarchy fields and canonical validation before implementing additional filtering features. 