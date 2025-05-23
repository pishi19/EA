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

## 📦 Dependency Management with UV

To streamline the setup and management of dependencies, we’ve implemented UV, a tool designed for efficient dependency handling in projects. Here’s a quick overview of our approach:

### Steps Taken:

1. **UV Installation**:
   - UV is installed using:
     ```bash
     curl -LsSf https://astral.sh/uv/install.sh | sh
     ```
   - Confirm installation via:
     ```bash
     uv --version
     ```

2. **Requirements File**:
   - Maintain a `requirements.txt` at the root of the project, listing all necessary Python libraries.

3. **Dependency Installation**:
   - Install project dependencies with UV:
     ```bash
     uv pip install -r requirements.txt
     ```

4. **Code Quality**:
   - Adopted **Flake8** for linting:
     ```bash
     uv pip install flake8
     flake8 .
     ```
   - Utilized **Black** for code formatting:
     ```bash
     uv pip install black
     black .
     ```

5. **Documentation**:
   - Ensure setup instructions are documented in `README.txt`.
   - Add basic docstrings to functions and classes.

### Immediate Actions:
- Validate setup with a smoke test.
- Regularly update dependencies using:
  ```bash
  uv pip install --upgrade -r requirements.txt
  ```

Feedback and team iterations can refine this process further. This setup aims for quick adaptation and efficient version control integration for ongoing and future developments.

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
