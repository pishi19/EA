# EA System

## Overview

The EA System is a modular, extensible platform designed to support continuous improvement, automation, and knowledge management. It is built with a strong emphasis on **systems thinking** and **feedback loops**, enabling adaptive workflows and robust information flow across projects, tasks, and knowledge domains.

---

## System Diagram

```
[Email / Notes / API]
        ↓
    [Ingestion Engine]
        ↓
   [Loop Memory Layer] <--> [Feedback Engine]
        ↓
   [Dashboards & Reports]
```

- Data flows through ingest, becomes structured, and feeds adaptive memory.
- Feedback closes the loop between human action and system behavior.

---

## Systems Thinking & Feedback Loops

At its core, the EA System is designed as a living system:

- **Feedback Loops:**  
  Every major process (task management, learning, automation, and reporting) is instrumented with feedback mechanisms. This allows the system to adapt, self-correct, and evolve over time.
    - Example: User feedback on loops and tasks is logged, analyzed, and used to adjust priorities and workflows.
    - Automated scripts and agents monitor system state, log changes, and trigger updates or alerts as needed.

- **Modularity:**  
  The system is composed of loosely coupled modules (e.g., ingestion, memory, feedback, reporting) that interact through well-defined interfaces and shared data structures.

- **Transparency & Traceability:**  
  All actions, changes, and feedback are logged and can be traced back to their source, supporting both accountability and learning.

- **Continuous Learning:**  
  The system is designed to learn from its own operation, user input, and external data, closing the loop between action, observation, and adaptation.

---

## How It Works

Here's a practical walkthrough of how core components operate:

**1. Ingestion → Task Creation**
- Input: Email with subject "Client Night RSVP – Mecca – June 12"
- Script parses date and subject, creating a task file:
  ```markdown
  ---
  source: email
  date: 2025-06-12
  project: Mecca Nights
  tags: [event, RSVP]
  loop: loop-2025-06-12-mecca
  ---
  Review RSVP list and confirm with Mecca rep
  ```

**2. Loop Memory**
- Tasks are embedded in "loops" — markdown files enriched with YAML frontmatter.
- Example loop file:
  ```markdown
  ---
  id: loop-2025-06-12-mecca
  weight: 0.7
  status: active
  feedback: []
  ---
  # Mecca Client Night – June 12
  Coordinate event execution with consultants and partners.
  ```

**3. Feedback Integration**
- Users tag outputs (`#useful`, `#false_positive`) or edit tasks directly.
- These actions trigger memory adjustments and loop weight recalculations.

**4. Reporting & Adaptation**
- Dashboards reflect loop/task state, feedback counts, and signal quality.
- System uses historical performance and tagging patterns to reprioritize or adjust future parsing.

---

## Key Features

- **Automated Ingestion:**  
  Pulls in data from email, notes, and other sources, transforming it into actionable tasks and knowledge.

- **Memory & Context:**  
  Maintains a persistent, queryable memory of loops, tasks, and feedback, supporting both human and AI agents.

- **Feedback Integration:**  
  Users and agents can provide feedback on loops, tasks, and system outputs, which is then used to refine future actions.

- **Dashboards & Reporting:**  
  Generates summaries, dashboards, and logs to provide visibility into system state and progress.

- **Extensible Automation:**  
  Easily add new scripts, agents, or integrations to expand system capabilities.

---

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/pishi19/EA.git
   cd EA
   ```

2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

3. **Configure paths and environment variables:**  
   All system paths are managed in `src/path_config.py`. Update this file if you need to change storage locations or integrate with new data sources.

4. **Run core modules:**  
   See the `src/` directory for entry points to ingestion, feedback, memory, and reporting modules.

---

## Contributing

- Please read the code of conduct and contribution guidelines.
- All paths should be managed via `src/path_config.py`—no hardcoded paths!
- Use feedback loops: log your changes, test, and document the impact.

---

## Philosophy

> "A system is more than the sum of its parts; it is a product of their interactions."  
> — Donella Meadows

The EA System is built to be adaptive, transparent, and continuously improving—just like the best human organizations.

---

## Glossary

- **Loop:** A markdown-based reasoning unit containing tasks, tags, weight, and feedback history.
- **Feedback:** User input on system accuracy, used to adjust parsing logic and loop weights.
- **Memory:** Persistent record of all loops, indexed via Qdrant and tracked in SQLite.
- **Ingestion:** Process of transforming raw inputs (emails, notes) into structured tasks.
- **Weight:** A numeric value that indicates importance or signal strength of a loop or task.

---

## License

[MIT License](LICENSE)

# EA Signal Pipeline

## 🧠 Overview
A semantic signal classification pipeline for the Ora Executive Assistant system. It routes incoming emails into structured loop memory using program-specific YAML configs.

## 🗂️ Directory Structure
- `config/programs/`: YAML configs per program (e.g., Mecca, CRM Migration)
- `emails/`: Sample email JSON inputs
- `vault/`: Output loop markdown files
- `tests/`: Test suite and test data
- `docs/`: System documentation

## 🚀 Running the Pipeline

To run on a test file:
```bash
python3 route_email_signals.py \
  --emails_path=emails/sample.json \
  --processed_ids_path=emails/processed.json \
  --programs_dir=config/programs/ \
  --vault_root=vault/
```
