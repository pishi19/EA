# ⚙️ Project Systems Overview

_A concise map of our EA Assistant automation architecture, active flows, and roadmap features. Add notes, links, and todos inline as things evolve!_

---

## 🔄 Routing System

- **Task/Loop Routing:**  
  - Semantically matches incoming tasks to `/02 Projects/Projects/`
  - Backlinks and task logs are appended to relevant project files
  - Actions are logged; auditability via trace scripts

- **Log Location:**  
  - Primary: `project_trace_log.md` (TBD/Planned)
  - Supplementary: `/logs/`, inline project notes

---

## 🧠 Goal Extraction

- **Goal YAML Extraction:**  
  - Parses and normalizes `goal:` fields in project files
  - Cross-matches tasks/loops to project goals
  - Machine-readable format for further automation

---

## 👥 People Mapping

- **Auto-linking:**  
  - (Planned) Detects people/entities in tasks/loops and auto-links to `/04 People/*.md`
  - Adds `person:` fields to YAML or inline when detected
  - Prepping for BambooHR sync and entity alignment

---

## 📡 Signal Source Dashboard

- **Routing Source Analytics:**  
  - (Planned) Displays task-routing efficacy by source (Email, BambooHR, Slack [future])
  - Enables click-through from dashboard to task trace or feedback

---

## 📥 BambooHR Integration

- **Metadata Sync:**  
  - (Planned) Syncs people metadata (name, role, org tree) from BambooHR
  - Links `/04 People/*.md` to HR records
  - Uses HR hierarchy to power accountability and routing

---

## 🛡️ System Health & Monitoring

- **LFS & Storage Checks:**  
  - (Partial/manual) Recommend monitoring to avoid storage/rate-limit push errors

- **Error/Trace Logs:**  
  - Key scripts output to `/logs/`
  - (Planned) Unified markdown logs for cross-system traceability

---

## 📅 Next Up / TODOs

- [ ] Project trace log: Implement `project_trace_log.md`
- [ ] Build People/HR entity auto-link & BambooHR sync
- [ ] Launch source-by-source routing dashboard
- [ ] Stabilize YAML normalization for `goal:` and `person:` fields
- [ ] Integrate LFS/storage usage monitoring in CI/push pipeline

---

## 📎 Quick Links

- [[02 Projects/Projects/]]
- [[04 People/]]
- [[logs/]]

---

*Edit and extend this page as systems evolve!*