# 🧠 Ora Executive Assistant — Project Brief for Isaac

## Overview

**Ora** is a custom Executive Assistant system designed to manage complex, multi-sided workflows with semantic intelligence. It blends loop-based memory, roadmap execution, and automated reflection pipelines. Ora is written in **Python**, interacts with **Obsidian** and **Cursor**, and follows a systems thinking approach structured around **PARA (Projects, Areas, Resources, Archives)**.

The system is designed for:
- Automatic triage from email or user input
- Semantic task classification and loop association
- Feedback-driven roadmap prioritization
- Persistent UI + remote operation
- Spiritual and philosophical alignment in its logic (Bahá’í-informed retrospectives)

---

## 🔧 Current System Architecture

- **Core Codebase**: `/Users/air/ea_assistant/`
- **Vault Location**: `/Users/air/AIR01/`
- **Execution Environment**: Local + DigitalOcean Droplet (in setup)
- **IDE**: Cursor (source of truth, everything happens here)
- **UI Layer**: Streamlit (undergoing restoration after Cursor repair wiped working state)

**Key Components:**
- `loop_memory.py`: parses `.md` files with YAML frontmatter (loops, reflections)
- `data_loader.py`: central module to unify roadmap and reflection data
- `launch_streamlit.sh`: starts local UI server (port 8501)
- SQLite + Qdrant for storage and semantic search
- Email → signal parser (planned for post-Gmail-free slice)

---

## ✅ Accomplished

### System Logic
- YAML loop structure defined and indexed
- Reflection tagging logic embedded
- Semantic feedback tags (`#useful`, `#false_positive`) integrated
- Retrospective pipeline auto-tags insights → loop → feedback loop

### Refactors
- Core loader abstraction (`data_loader.py`) under construction for unified UI data
- Droplet server functional (remote URL confirmed)
- MVP test environment linked to a full PARA file structure

### UI
- Roadmap UI previously working (modular, clickable loop→phase)
- Rebuilding underway after regression from Cursor auto-repair
- Reflection linking partially re-established

### Process
- All roadmap items tied to numbered phases (e.g. `1.1 Refactor Inbox`)
- Daily/weekly retros auto-summarized and fed back into loop weighting
- Phased execution now implemented for project planning

---

## 🧭 Next Priorities (High Resolution)

### Phase 2: UI Restoration (Active)
- [ ] Modular roadmap UI: refactor Streamlit to pull from `data_loader.py`
- [ ] Reflection linking: enable semantic linkage to loop insights
- [ ] Regression testing: confirm dashboard and YAML sync fully

### Phase 3: Roadmap Logic
- [ ] Map each roadmap entry to numbered YAML phase files
- [ ] Ensure loops reflect completed items via checklist feedback
- [ ] Establish loop weight influence from feedback summaries

### Phase 4: Feedback Pipeline
- [ ] Weekly loop scoring: auto-summarize feedback-tagged retros
- [ ] Influence prioritization from feedback patterns
- [ ] Begin usage-based learning via loop frequency and weight tracking

### Phase 5: Droplet Deployment
- [ ] Complete full remote stack operation
- [ ] Ensure `~/ea_cursor_system_coupled` on Droplet is persistent
- [ ] Sync Obsidian + Cursor across environments (requires rsync or remote Obsidian logic)

### Phase 6: Testing Infrastructure
- [ ] Auto-tests on reflection pipeline and data loader
- [ ] Test cases for roadmap consistency, loop resolution, YAML validity
- [ ] Begin full regression suite, focus on loader and UI fragility

---

## 🧪 Current Development Practices

- All code written and tested in **Cursor**
- Streamlit app run via `launch_streamlit.sh` (run from `/deploy`)
- Deployment pipeline is manual but clean; automation to come
- Backups and version control are Git-based; risk: Obsidian sync may introduce corruption

---

## 🔍 Philosophy and Direction

Ora is not just a task manager — it is a **thinking assistant**, grounded in:
- Clarity of structure (semantic loops over flat lists)
- Feedback intelligence (loop weighting evolves from use)
- Reflective depth (insights, not just actions)
- Systems design (roadmap integrity, execution traceability)
- Spiritual alignment (reflection loops include virtues and values)

We’re now entering the **“deep functional slice”** phase — establishing one full vertical use case **without Gmail**, to finalize data flows, UI logic, and loop execution.

Following this, we will:
- Integrate full Gmail signal parsing
- Run a Figma/MCP experiment to unify UI
- Shift to persistent remote operation and testing
