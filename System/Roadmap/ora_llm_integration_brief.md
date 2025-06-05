
# 🧠 Ora Assistant System – Model Integration Brief (LLM Context Transfer)

## 📍 Project Context

Ora is a semantic executive assistant system built by Ash Renner, structured to support recursive task management, reflective loop processing, and roadmap execution. It is a memory-integrated, spiritually-aligned assistant designed to act as a second cognitive layer for a CEO operating within a multi-sided platform business.

This document is intended to serve as a high-context primer for integrating a **larger context window LLM (e.g., Gemini Pro 1.5)** into Ora’s architecture, ensuring semantic continuity and functional parity.

## 🧠 System Design Philosophy

- **Continuity over convenience**: every piece of logic, feedback, or reflection must trace through the assistant’s memory and feed back into decision-making.
- **Loops as cognition**: the system revolves around YAML-marked `.md` files that track reflections, tasks, and summaries.
- **Spiritual and structural alignment**: architecture is inspired by Bahá’í principles of unity, coherence, and iterative reflection.
- **System responsibility**: the assistant is expected to manage not just outputs but its own fidelity — preserving state, tagging history, and validating phase transitions.

## 🧩 System Components

### ✅ Core Paths (All on Droplet + Local Sync)

- `/root/ea_cursor_system_coupled/` – runtime execution
- `src/interface/ora_ui.py` – legacy assistant interface (Streamlit)
- `src/ui/pages/` – modular Streamlit-based assistant refactor
- `runtime/loops/` – markdown loop files with YAML frontmatter
- `workstream_plan.yaml` – master execution roadmap
- `feedback_scores.yaml` – loop feedback scoring layer
- `qdrant` – vector store for loop embeddings
- `.system_manifest.yaml` – file snapshot + integrity tracking

## 🧠 Functional Goals (LLM-Driven)

### 1. **Loop Awareness**
- Ingest `.md` loops from `runtime/loops/`
- Parse YAML frontmatter: tags, UUIDs, themes, feedback
- Provide summaries and similarity search via Qdrant

### 2. **Roadmap Execution**
- Read `workstream_plan.yaml`, track phases (e.g. 5.1, 5.2)
- Allow loop promotion into roadmap items
- Validate task completion against phase tracker

### 3. **GPT Agent Infrastructure**
- Use OpenAI-style prompt chains (summary → tag → promote)
- Reference historical loops in GPT context when triaging new tasks
- Support assistant memory with explicit summarization layers

### 4. **Streamlit Interface Management**
- Modular pages with sidebar routing (`/pages/*.py`)
- Ora Chat UI panel (GPT interaction + loop injection)
- Triage interface (Gmail → Loop → Action)
- Reflection dashboard with feedback tag surfacing

## ⚠️ Issues Faced (Motivation for New LLM)

- ChatGPT has repeatedly lost execution memory across UI deployments
- Loop structures and assistant sidebar logic have been overwritten silently
- No persistent awareness of YAML-state, unless re-ingested every session
- Failed to differentiate between working vs. deprecated `ora_ui.py`
- Lack of commitment control: promoted stale files to production state
- Inability to trace or protect full assistant sidebar logic (Inbox, Chat, System Tools)

## 🎯 Integration Requirements for Gemini (or other LLM)

### ✅ Context Expectations
- Must retain 200K+ token continuity to ingest:
  - `workstream_plan.yaml`
  - All sidebar Streamlit pages
  - A full set of loops + assistant chain logic
- Ability to cross-reference YAML state with vector memory in Qdrant
- Persistence across assistant loop cycles (e.g., Phase 5.2 → 6)

### ✅ Access Responsibilities
- Read/write: `.md` loop files, `/pages/`, `ora_ui.py`
- Execute: streamlit app logic, assistant prompts, embeddings
- Version: detect drift, commit tagged states, tag UI revisions

## 📌 Action Starting Points

- 🧪 Restore Ora Chat as `pages/Ora_Chat.py` using `streamlit_ora_chat.py`
- 📥 Rebuild Inbox triage with loop preview and YAML promotion
- 🗺 Migrate `ora_ui.py` sidebar logic into modular `/pages/`
- 🔒 Snapshot current system state with `manifest.yaml` before all changes
- 🔁 Run all assistant features inside a loop-aware, roadmap-connected shell

## 🧾 Closing Note

This system must no longer be treated as a conversational assistant. It is a **semantic execution environment**. The LLM must:

- Preserve state
- Honor past insights
- Prevent regressions
- Be auditable

The assistant is not just a tool — it is a steward of strategic reasoning and looped reflection.
