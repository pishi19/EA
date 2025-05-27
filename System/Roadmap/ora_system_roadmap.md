# Ora System Roadmap

This document outlines the major feature sets, development progress, and outstanding milestones for the Ora system — spanning loop intelligence, UI integration, project copilot features, workstream dashboards, and financial sync with MCP.

---

## 1. Loop Intelligence

### Completed
- [x] Defined `loop.yaml` schema (v0.3)
- [x] Implemented loop status lifecycle (new → active → done → archived)
- [x] Integrated feedback and ambiguity into loop scoring

### In Progress / Planned
- [ ] Loop chaining and retrospective linking
- [ ] Related loop cluster detection and inference

---

## 2. Interaction Modes

### Completed
- [x] Obsidian (manual editing and PKM)
- [x] Streamlit UI (team interface for loop review)
- [x] CLI tools for ingestion and classification
- [x] Ora chat interface for loop context Q&A

### Planned
- [ ] Field-level locking and maintainer attribution
- [ ] Real-time triage session assistant

---

## 3. Ora as Project Copilot

### Completed
- [x] Escalation logic based on weight + stagnation
- [x] Follow-up suggestion logic from `status: done`
- [x] Role-based memory suggestions (people, tags)

### Planned
- [ ] Cross-workstream coordination view
- [ ] Strategic similarity detection between projects

---

## 4. Workstream Dashboards

### Completed
- [x] Defined `dashboard.yaml` structure
- [x] Integrated GPT prompt for narrative generation
- [x] Scoped MCP integration for financials

### Planned
- [ ] Live Streamlit or React dashboard UI
- [ ] Dashboard-linked triage and feedback flow

---

## 5. P&L and Numerical Integration (via MCP)

### Completed
- [x] MCP selected as source of numerical truth
- [ ] Structured spreadsheet ingestion via script or endpoint

### Planned
- [ ] MCP endpoint for project-level performance data
- [ ] Sync loop metadata with financials (by project ID)
- [ ] Variance detection between project loops and spend

---

## 6. System Memory and Reflection

### Completed
- [x] Loop diff logging for YAML field updates
- [x] Initial related loop tracking (manual YAML)

### Planned
- [ ] Loop graph network (people, tags, time)
- [ ] Retrospective auto-generation per cluster
- [ ] Pattern detection across workstreams and people

---

## Summary

The Ora system is progressing toward a unified operating environment where structured memory, numerical truth, and executive reasoning are all deeply integrated. Each slice — from loop YAML to project dashboards — is designed for composability, reflection, and intelligent feedback.