
# 🛣️ Ora Signal Pipeline – System Roadmap

## ✅ Current System State (v0.1)

- Fully functional classification pipeline
- YAML-configured programs and projects
- Signal scoring (confidence, priority, ambiguity)
- Loop files written with full frontmatter
- Streamlit UI for triage, filtering, and review
- Buttons: Confirm, Reclassify, Ignore
- Triage log tracking user actions
- Full test suite
- `.venv` with locked dependencies
- All documentation up to date

## 🧱 Core Components

- `route_email_signals.py` – main processor
- `config/programs/` – YAML configs
- `vault/` – loop output memory
- `ui/inbox.py` – Streamlit inbox
- `tests/` – test suite
- `docs/system/` – architectural documentation

## 🔜 Upcoming Milestones

### 1. ✏️ Reclassification Flow
- Reassign loops to new program/project via UI
- Update YAML and triage log

### 2. 📊 Dashboard Tab
- Display loop status across all programs
- Show backlog, ambiguity, priority metrics

### 3. 💬 Memory Summarization
- LLM-powered loop summaries
- Written to `summary:` field in YAML

### 4. 📥 Live Signal Ingestion
- Gmail API → signal pipeline → loop files
- Real-time triage and memory updates

## 🔮 Long-Term Vision

- Ora becomes a full signal memory system
- All inputs (email, chat, voice) route to loops
- Summary, status, and retrieval are system-native
- Integrated UI + task flow

## 🔖 Current Version
`v0.1` (Tagged)

Includes classification, triage UI, YAML structure, test coverage, and system documentation.
