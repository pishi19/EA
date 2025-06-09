---
uuid: <autogen>
title: Canonical Taxonomy Commit – Workstream/Program/Project/Artefact Model
date: 2025-12-14
author: Ash
type: taxonomy-commit
tags: [taxonomy, roadmap, commit, structure]
status: committed
---

# 🛡️ Canonical Taxonomy & Roadmap Structure (Checkpoint 2025-12-14)

**Summary:**  
This document commits and tags the agreed semantic model for all future Ora workstream, program, project, and artefact structure. It is the single point of return should the architecture or taxonomy drift.

---

## 🚦 Decision

- **Workstream**: `"Ora"` — synonymous with the system roadmap, default and root context.
- **Program**: `"Phase"` — sequenced, strategic units (e.g., `Phase 11 – Artefact Hierarchy and Filtering`).
- **Project**: Grouping of artefacts within a program (e.g., `Inline Task Mutation in Filtered View`, `Semantic Chat Demo Filtering`).
- **Artefact**: The atomic unit of work: `task`, `note`, or `thought`.

---

## 🗂️ Artefact Frontmatter Template

```yaml
---
uuid: <autogen>
workstream: Ora
program: Phase 11 – Artefact Hierarchy and Filtering
project: Inline Task Mutation in Filtered View
artefact: Scaffold inline mutation UI controls
phase: 11.2.2.1
status: in_progress
type: task    # or: note, thought
tags: [ui, mutation]
score: 0
created: 2025-12-14
owner: Ash
---
```

---

## 🏗️ Protocol

- **Roadmap.md** is the only source of truth.
- All artefacts (task, note, thought) must be present in the roadmap, with explicit linkage to program and project.
- No orphan artefacts: all exist within the roadmap tree.
- UI filtering always begins at workstream = "Ora" (the roadmap root), and slices by program, project, or artefact type.
- All creation, mutation, and completion actions go through the roadmap → artefact → API pipeline.
- Expansion to multiple workstreams is supported in future, but “Ora” is default.

---

## 📝 Change Log (for roadmap.md)

- [2025-12-14] Canonical taxonomy commit: Standardized hierarchy (workstream/program/project/artefact). “Ora” is default workstream/root. All artefacts (tasks, notes, thoughts) must exist in roadmap tree, with unified frontmatter and UI filter logic. Commit and tag: taxonomy-2025-12-14-canonical-structure.

---

## 🧾 Execution Log

- 2025-12-14: Canonical taxonomy and roadmap structure committed and tagged at taxonomy-2025-12-14-canonical-structure.
- Model: workstream ("Ora") → program (phase) → project (grouping) → artefact (task/note/thought).
- All artefacts versioned and discoverable only within roadmap tree. UI filtering aligned.

---

## 🏷️ Git Commit and Tag

**Commit Message:**
```
🛡️ taxonomy-commit: canonical workstream/program/project/artefact model (2025-12-14)
- Standardized hierarchy: workstream ("Ora") = roadmap, program = phase, project = grouping, artefact = task/note/thought
- Roadmap.md is the single source of truth; all artefacts must be present and linked in the roadmap
- Artefact frontmatter and UI filtering logic updated for unified model (type: task | note | thought)
- Roadmap dropdown/root = "Ora" (system workstream), with all slicing/filters remaining within the roadmap tree
- No orphan artefacts; future expansion and mutation protocol governed by this model
```

**Tag:**  
```
taxonomy-2025-12-14-canonical-structure
```

---

**Return here if the execution model or artefact structure ever needs to be reset or clarified. This is the authoritative checkpoint.**
