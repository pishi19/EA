# 📍 Ora Execution Roadmap: Phases 1.5 → 1.9

This document outlines the current strategic trajectory for Ora following the stabilization of the loop slice (Phase 1.4). Each phase represents a semantic, testable unit of architectural evolution, with deliverables grounded in roadmap-linked files and state tracking.

---

## ✅ 1.5 – Insight Feedback + Testing + Promotion (Active)

### 🎯 Goal:
Establish robust testing, feedback tag parsing, and begin logic for loop promotion based on metadata quality and user input.

### 🧩 Scope:
- Implement `/tests/`:
  - `test_status_writer.py`
  - `test_vault_index.py`
  - `test_feedback_tags.py`
- Tag-aware loop weighting (stubbed)
- Parse `feedback:` tags from insight YAML
- Maintain `status.json` across pages with `roadmap_id: 1.5`

---

## 🧪 1.6 – GPT Summary Evaluation + Promotion

### 🎯 Goal:
Incorporate LLM-based scoring of loop summaries and establish promotion rules for high-quality loops.

### 🧩 Scope:
- Build `summary_scorer.py`
- Add `score:` field to loops from GPT
- Promote loops with:
  - `score ≥ threshold`
  - `feedback: positive`
  - `matched roadmap_id`

---

## 📬 1.7 – Gmail Signal Pipeline (Reconnect)

### 🎯 Goal:
Reintroduce email ingestion with classification, deduplication, and promotion-to-loop automation.

### 🧩 Scope:
- Reconnect `gmail_ingest.py`
- Integrate classification via `classify_structured_email_tasks.py`
- Map matched tasks to loop creation or updates
- Link Gmail thread IDs to loop metadata

---

## 🚦 1.8 – Workstream Routing + Program Assignment

### 🎯 Goal:
Enable loop-to-project routing and semantic alignment of incoming signals with structured initiatives.

### 🧩 Scope:
- Build `workstream_router.py`
- Assign loops to:
  - `Program`
  - `Project`
  - `Workstream`
- Generate per-workstream dashboards
- Write router results to roadmap-aware index

---

## 🧠 1.9 – MCP Partner Slice UI

### 🎯 Goal:
Unify roadmap, loop, and reflection interaction into a lightweight MCP-style control panel. Pilot this with a Mecca or partner use case.

### 🧩 Scope:
- Design `slice_view.py` interface for MCP
- Enable interactive feedback, loop creation, and promotion
- Include partner-aware tagging (`partner_id`, `program`, etc.)
- Allow real-time LLM-assisted edits
