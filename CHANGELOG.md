# 🧾 CHANGELOG

## [v0.1.0] – Stable EA Signal & Triage System (2025-05-31)

### Highlights
- ✅ Modular Streamlit UI with navigation and emoji-indexed pages
- ✅ Refactored Inbox, Reflections, Roadmap, GPT Chat, and Insights views
- ✅ Unified `data_loader.py` for safe, YAML-aware vault access
- ✅ Deployed on Droplet at `170.64.176.146:8501` with systemd persistence
- ✅ Streamlit `launch_streamlit.sh` and `ora.service` for managed hosting
- ✅ GPT integration via `gpt_ora_chat.py` with loop summaries
- ✅ Diagnostic panel added for loader health + vault debug
- ✅ Pre-commit passing (no legacy `ui.panels`, no broken imports)

### Technical Changes
- Added: `src/ui/` with modular `render_<page>` methods
- Added: `src/system/gpt_ora_chat.py` and `test_loader.py`
- Added: `docs/system/streamlit_ui.md`
- Added: `deploy/` folder with launch script and systemd service
- Cleaned: `requirements.txt` (OpenAI, Streamlit, Frontmatter)
- Removed: Legacy `load_roadmap_items`, `chat_panel`, `inbox_panel`

### Deployment
- Fully deployed on Droplet with `systemctl enable ora`
- All UI modules verified live on production server
- GPT chat functional with API key loaded via launch script
