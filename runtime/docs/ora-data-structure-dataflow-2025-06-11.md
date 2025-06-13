
---
title: Ora Data Structure & Data Flow Deep Dive
created: 2025-12-21
author: Ash & Ora
tags: [architecture, data-flow, systems, audit, recommendations]
---

# Ora System – Data Structure and Data Flow Deep Dive

## Overview

This document provides a consultative, end-to-end deep dive into the data structures, data flows, and integrity protocols of the Ora system as of late 2025. It is intended for system architects, developers, agents, and future contributors seeking to onboard, debug, or extend Ora in multi-workstream, agentic, or compliance-intensive environments.

---

## 1. Data Structure: Where Does Data Live?

### **A. Canonical Data Stores**
- **Roadmap files:**  
  - Each workstream has its own `roadmap.md`  
    e.g. `/runtime/workstreams/ora/roadmap.md`, `/runtime/workstreams/mecca/roadmap.md`
  - *Purpose:* Master plan—programs/phases, projects, tasks, context, execution logs

- **Artefact files:**  
  - Per-workstream artefact directories  
    e.g. `/runtime/workstreams/ora/artefacts/`
  - *Purpose:* Atomic units of work (task/note/thought/execution/loop). Each artefact has canonical frontmatter:  
    `uuid`, `title`, `phase`, `workstream`, `project`, `status`, `tags`, etc.  
    Sections: Objectives, Tasks, Execution Log, Memory Trace, System Context

- **Logs:**  
  - Workstream-specific log files (execution, memory, audit, agentic actions)

- **Registry/Config:**  
  - Central workstream registry (e.g., `/runtime/workstreams/registry.json`)  
  - Tracks all active workstreams and global configuration

---

### **B. Supporting Data (Live System State)**
- **In-memory server state:**  
  - For UI filtering, tree navigation, optimistic UI, cache
- **API-layer state:**  
  - API endpoints dynamically serve filtered, scoped, and validated data

---

## 2. Data Flow: When and Where Is Data Pulled?

### **A. UI Initialization / Page Load**
- **Homepage/Workstream Switch:**  
  - Loads available workstreams (from registry/config)
- **Workstream Main View:**  
  - Loads `roadmap.md` and artefact metadata for the current workstream
  - Artefact content fetched on demand (card expansion, context pane, chat)

### **B. Navigation & Filtering**
- **Filter Application:**  
  - API called (`/api/demo-loops`, `/api/plan-tasks`, etc.) with workstream param
  - API returns filtered artefact/task set from correct workstream's roadmap and artefacts

### **C. Artefact/Task Mutation**
- **Mutation Trigger:**  
  - UI calls mutation API with workstream, artefact ID, operation details
  - API updates artefact file, status, tags, logs mutation in execution log and memory trace
  - UI updates reflect changes (re-fetch, optimistic update, or websocket)

### **D. Chat/LLM/Agentic Actions**
- **Chat or Agent Action:**  
  - `/api/artefact-chat` receives artefact ID, workstream, context
  - API pulls artefact file, roadmap.md, and system prompt/context for LLM
  - LLM generates response, mutation, or suggestion, all logged in memory trace and artefact

### **E. Testing & Audit**
- **Automated/Manual Audits:**  
  - Scripts or tests scan all workstream dirs for artefacts
  - Compare against roadmap.md (detect orphans, stale artefacts)
  - Validate schema, permissions, mutation, and audit coverage

---

## 3. Consultative Review: Key Data Flow Questions

- **Where is the source of truth for this action/data?**
    - Is it roadmap.md, artefact file, memory trace, log, or registry?
- **What triggers a data pull or update?**
    - Is it page load, filter change, mutation, chat, or agentic suggestion?
- **How is workstream context passed and validated?**
    - Is it in the URL, API query/body/header, or UI state?
- **How is data kept in sync?**
    - Does the UI cache, poll, subscribe, or always re-fetch?
- **How are conflicts or concurrent edits handled?**
    - Last-write-wins, optimistic UI, conflict prompts, or audit trail?

---

## 4. Common Points of Data Tangle or Risk

- **Implicit "Ora" defaulting:** Any UI/API that assumes "Ora" without explicit context may create drift or data bleed.
- **Unlogged artefact mutations:** Direct file edits not passed through API break the chain of custody.
- **Partial agentic context:** LLM/agent actions that only see artefact but not roadmap/phase/system context are less reliable.
- **Batch ops:** Must validate context and sync after every mutation.
- **Orphaned artefacts:** Artefacts not in roadmap.md cause audit/UI confusion.

---

## 5. Recommendations

1. **Document All Data Flows:**  
   - For every workflow (load, mutate, chat, audit), have an explicit diagram/table mapping data sources, triggers, and syncs.

2. **Enforce Explicit Workstream Context:**  
   - All UI, API, and agentic actions must require and log the workstream parameter—never assume "Ora" or any default.

3. **Log Every Mutation and Agentic Action:**  
   - All changes (manual or agentic) should be recorded in the artefact's execution log and, if critical, the roadmap.md execution log.

4. **Audit for Orphans and Stale Data:**  
   - Regularly run orphan detection and schema audits across all workstreams.
   - Surface audit results in the admin UI.

5. **LLM Prompt Consistency:**  
   - All LLM/agentic prompts must include full artefact, program, workstream, and roadmap context—never partial views.

6. **Batch Operations Protocol:**  
   - Re-validate context and refresh UI/data state after every batch mutation.
   - Confirm batch logs and rollback capabilities.

7. **Conflict and Error Handling:**  
   - Define and implement last-write-wins, optimistic rollback, and audit trail resolution for all concurrent mutations.

8. **Versioned Snapshots:**  
   - Regularly snapshot artefact, roadmap, and config files for disaster recovery and rollback.

9. **Agentic Training:**  
   - Onboard agents with data flow diagrams, audit logs, and roadmap.md as the canonical system-of-record.

---

## 6. Next Steps

- Review this doc with your team/assistants/agents before any major workflow change, new integration, or migration.
- Use as the onboarding reference for new contributors or LLM agents.
- Expand with flowcharts or scenario walk-throughs for critical workflows.
- Revisit after every system audit or architecture refactor.

---

**This document is living: update and expand as the Ora system grows, audits, or evolves.**
