
# 📁 EA System Files to Monitor in Obsidian

This list outlines the core files used to operate, reflect on, and evolve the EA system inside your Obsidian vault.

---

## 🧭 System Control / Interactive

| File | Path | Purpose |
|------|------|---------|
| `EA_Phase_Tracker.md` | `System/Meta/` | Live phase tracking, checklists, and strategic transitions |
| `system_state_view.md` | `System/Meta/` *(or create)* | Snapshot of system progress, open loops, file relationships |
| `loop_status.md` | `session_logs/structured/` or `Dashboards/` | Loop weight/status dashboard refreshed daily |
| `system_log.md` | `System/Meta/` | Live log of changes, events, decisions |
| `loop-YYYY-MM-DD-*.md` | `Retrospectives/` | Daily semantic memory entries tied to sessions and projects |
| `EA_Migration_Realignment_Plan.md` | `System/Meta/` | Strategy + postmortem + phase reset document |

---

## 🧾 Reference / Templates

| File | Path | Purpose |
|------|------|---------|
| `EA_Cycle_Review_Templates.md` | `System/Meta/` | Daily, weekly, and monthly checklists |
| `EA_Path_Refactor_Checklist.md` | `System/Meta/Archive/` | Archived list of files updated for path normalization |
| `Retrospective_Template.md` | `System/Templates/` | New loop starter format |
| `Prompt_Context_Template.md` | `Cursor/Prompts/` | Used to inject prompt context in Cursor sessions |

---

## 🛠 Code / Infra (Reference Only in Obsidian)

| File | Path | Purpose |
|------|------|---------|
| `path_config.py` | `src/` | All system paths defined centrally |
| `find_hardcoded_paths.py` | `tools/automation/` | Locates legacy path references |
| `ea_validate_integrity.py` | `tools/automation/` | Structural system integrity checker |
| `daily_refresh.py` | `src/daily/` | Generates daily loop/dashboard updates |

---

## 🧠 Optional Strategic Indexes

| File | Path | Purpose |
|------|------|---------|
| `EA_Control_Center.md` | `System/` | High-level overview of how everything connects |
| `Vision.md` | `System/` or `Vision/` | Long-term intent and design evolution notes |

---

## ✅ How to Use

- Pin key files to your Obsidian sidebar
- Backlink loops to projects and sessions
- Use tags (`#active`, `#closed`) and YAML to drive dashboards
- Keep templates clean and clone from them

This list can evolve as your EA system grows.
