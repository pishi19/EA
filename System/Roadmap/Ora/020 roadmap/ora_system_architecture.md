# Ora System Architecture – Foundation Map

## 🧠 Purpose
This architecture document defines the key systems, modules, and operational domains of Ora. It ensures all ongoing development, GPT integration, UI refactor, and deployment logic are understood in relation to each other — enabling clarity, scope control, and reliable decision-making.

---

## 📦 Top-Level Modules

### 1. `src/`
| Submodule              | Purpose                                                  |
|------------------------|----------------------------------------------------------|
| `interface/`           | Streamlit UI entrypoint, page routing, render loop      |
| `ui/`                  | Modular page renderers: inbox, chat, reflections, etc.  |
| `system/`              | Loaders, GPT pipelines, deployment tools, configs       |
| `Roadmap/`             | Logic for roadmap-driven planning (optional/legacy)     |
| `cursor_dashboard.py` | (In progress) Interface logic for Cursor/Streamlit sync |

### 2. `vault/`
| Path                          | Contents                                   |
|------------------------------|--------------------------------------------|
| `0001 HQ/Inbox/`             | Inbox markdown files with YAML headers     |
| `Retrospectives/Loops/`      | Reflections + summary fields               |
| `Retrospectives/Insights/`   | Extracted insights from feedback           |
| `Roadmap/`                   | Structured roadmap files                   |

### 3. `deploy/`
| File                    | Purpose                                    |
|------------------------|--------------------------------------------|
| `launch_streamlit.sh`  | Boot script with OPENAI_KEY + PYTHONPATH  |
| `ora.service`          | systemd config for auto-launch             |
| `test_loader.py`       | CLI test harness for loader health         |

### 4. `docs/`
| File                            | Purpose                                  |
|--------------------------------|------------------------------------------|
| `streamlit_ui.md`              | UI overview + field breakdown            |
| `CHANGELOG.md`                 | Versioned log of release checkpoints     |
| `ora_v0.2.0_roadmap.md`        | Planning doc for next release            |

---

## 🔁 Operational Domains

### 🔄 Signal Ingestion
- Input: Gmail (future), markdown inbox files
- Processed by: `data_loader.py`
- Stored in: `vault/0001 HQ/Inbox/`

### 🧠 Loop Memory
- Input: Reflections with YAML + `summary:`
- GPT summarization handled by: `gpt_ora_chat.py`
- Indexed for chat via: `get_loop_summaries()`

### 📈 Insight Generation
- Insight markdown stored in `vault/Retrospectives/Insights/`
- Future LLM logic planned in `gpt_insights.py`

### 📊 Dashboard Views
- Streamlit pages: `render_dashboard()`, `render_inbox()`, `render_insights()`
- UI modules in `src/ui/`

### 🚀 Deployment
- Live Droplet at `170.64.176.146`
- Streamlit served on port `8501`
- Managed by `systemd` with `ora.service`

---

## ✅ Current Working Areas

### [v0.1.0]
- Refactor complete and deployed
- PR open and merged from `ora-deploy-merged`
- Tag `v0.1.0` pushed

### [v0.2.0]
- Planning in place (`ora_v0.2.0_roadmap.md`)
- Branch to be created: `v0.2.0-dev`
- Focus areas:
  - Feedback loop scoring
  - YAML editing in UI
  - Insight generation from GPT
  - Program dashboard views

---

## 🧭 Guidance
All features, commits, and GPT-enhanced behavior should be tied to:
- A roadmap item (vault/Roadmap/)
- A UI module (src/ui/)
- A loader or GPT utility (src/system/)

This map should be updated with each major refactor or version checkpoint to preserve systemic coherence.
