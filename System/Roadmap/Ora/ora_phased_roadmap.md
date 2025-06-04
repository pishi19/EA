
# Ora System Roadmap – Phased Development

> Ora is designed to extract signal from unstructured company communication (Gmail, Slack, etc.),  
organize it semantically via loops, and surface structured insight into programs, projects, and roadmap priorities.

This roadmap tracks the evolution of the system by phase, aligned with the architectural and philosophical goals of the project.

---

## ✅ Phase 1: Foundations

### 1.0 – Loop Memory + YAML Parsing
- Built `loop_memory.py`, initial SQLite memory structure
- Parsed `.md` loop files with YAML frontmatter

### 1.1–1.4 – Prompt-Driven Dev + GPT Repair Loop
- Injected system logic via GPT-only prompts
- Created `.cursor/prompts/fix-loop-test.md`
- Enabled `fix_runner.py` to catch and auto-patch test failures

### 1.5 – Session Reboot + State Enforcement
- All dev confirmed prompt-only
- Manifest tracking + session awareness initialized

---

## ✅ Phase 2: UI + Integrity

### 2.0 – UI Restoration
- Streamlit UI rebuilt (`streamlit_app.py`)
- Views: Inbox, Roadmap, Vault Overview, Loop Slice
- `render_inbox()`, `render_roadmap()` functional

### 2.1 – System Hardening
- `.system_manifest.yaml` created
- Pre-commit errors removed, import refactor (PYTHONPATH=src)

### 2.2 – Snapshot + Trace Logging
- `validate_manifest_hashes.py`: SHA-1 validator
- `create_ora_snapshot.py`: timestamped Git commit + tag tool
- `system_state_view.md` and `EA_Phase_Tracker.md` updated

---

## 🟡 Phase 3.0: Loop-to-Dashboard (Current Phase)

> Surface the relationship between loops, feedback, and roadmap influence.

- [ ] Render loop metadata and weight in dashboard views
- [ ] Visualize loop→program alignment, roadmap tagging, feedback tags
- [ ] Build tag summaries (e.g. `#useful`, `#false_positive`)
- [ ] Show loop promotion and decision traceability

---

## 🔜 Phase 4.0: MCP Wiring – Meta-Cognitive Pipeline

> Reason about reasoning.

- [ ] Ingest feedback from inbox / dashboard
- [ ] Apply influence from tag trends to roadmap item priority
- [ ] Promote loops to projects based on weight and consensus
- [ ] Show influence trace: tag → weight → promotion

---

## 🟡 Phase 5.0: Remote-First Stability

- [x] UI deployed to Droplet at `170.64.176.146:8502`
- [ ] Manifest sync confirmed on remote
- [ ] Deployment snapshot log entry written
- [ ] All Streamlit modules stable and import-correct

---

## 🔜 Phase 6.0+: Team Collaboration & Semantic Overlay

- [ ] Enable multi-user workspace logic
- [ ] Attach loops to people/entities via `04 People/`
- [ ] Summarize reflection patterns and decision networks

---

## 🔁 Thematic Goals Anchoring the Roadmap

| Theme                   | Status |
|-------------------------|--------|
| Prompt-only logic       | ✅ Enforced |
| Manifest-based integrity| ✅ Verified |
| Feedback weighting      | 🟡 Partial |
| Loop memory tracing     | 🟡 Active |
| Semantic dashboards     | 🔜 Needed |
| GPT-repair pipelines    | ✅ Running |
| MCP scaffolding         | 🔜 Upcoming |
