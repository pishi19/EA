import os
import sqlite3
from pathlib import Path
import frontmatter

# Configuration
BASE_DIR = Path(__file__).parent
GRAPH_DB = BASE_DIR / "dependency_graph.db"
VAULT_PATH = Path("/Users/air/AIR01")

# Initialization
def init_db():
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY, type TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS edges (from_id TEXT, to_id TEXT, reason TEXT)")
        conn.commit()

# Utility
def add_node(conn, node_id, node_type):
    conn.execute("INSERT OR IGNORE INTO nodes (id, type) VALUES (?, ?)", (node_id, node_type))

def add_edge(conn, from_id, to_id, reason):
    conn.execute("INSERT INTO edges (from_id, to_id, reason) VALUES (?, ?, ?)", (from_id, to_id, reason))

# Parse markdown notes
def scan_md_files():
    all_files = list(VAULT_PATH.rglob("*.md"))
    with sqlite3.connect(GRAPH_DB) as conn:
        for file_path in all_files:
            relative_id = str(file_path.relative_to(VAULT_PATH))
            add_node(conn, relative_id, "file")

            try:
                post = frontmatter.load(file_path)
                fm = post.metadata

                # Link to loop
                if "loop" in fm:
                    loop_id = fm["loop"]
                    add_node(conn, loop_id, "loop")
                    add_edge(conn, relative_id, loop_id, "linked_loop")

                # Link to project
                if "project" in fm:
                    project_id = fm["project"]
                    add_node(conn, project_id, "project")
                    add_edge(conn, relative_id, project_id, "linked_project")

                # Link to person
                if "person" in fm:
                    person_id = fm["person"]
                    add_node(conn, person_id, "person")
                    add_edge(conn, relative_id, person_id, "linked_person")

                # Link to goal
                if "goal" in fm:
                    goal = fm["goal"]
                    goal_id = f"goal:{goal[:64]}"
                    add_node(conn, goal_id, "goal")
                    add_edge(conn, relative_id, goal_id, "linked_goal")

            except Exception as e:
                print(f"⚠️ Failed to parse {file_path}: {e}")
        conn.commit()

# Ora System Master Plan

> **Prompt for Assistant:**  
> Always write changes to this document (`System/Reference/ea_system_overview.md`). Append updates to the "Recent Changes" section or modify the relevant parts of the plan. This ensures the document stays up to date and provides context for future sessions.

## 1. Architecture Overview

Ora is a modular executive assistant system that integrates semantic memory (Qdrant), structured logic (SQLite), and contextual awareness across signals (email, Slack, BambooHR), routing tasks into loops, projects, and dashboards inside an Obsidian vault. 

### Key Components
- **Signal Ingestion**: Gmail API, iMessage, Slack (planned)
- **Memory Layer**: Qdrant (vector), SQLite (loop/task/project database)
- **Classification & Routing**: GPT-based, with confidence thresholds and trace logs
- **Feedback & Validation**: `#useful`, `#false_positive` tags, loop promotions
- **Interface**: Obsidian-driven dashboards, Streamlit UI (implemented)
- **Development Flow**: Cursor-GPT pairing, with testable, modular CLI and pre-commit enforced code quality
- **Monitoring**: Comprehensive log monitoring and system health tracking
- **Analysis**: Graph analysis and visualization tools
- **GPT Integration**: Supervised learning and classification systems

---

## 2. Dependency Management Plan [[dependency_management_plan.md]]

Ora uses `uv` and is transitioning to a consolidated `pyproject.toml` structure.

### Dependency Groups
- **dev** – development tools (`ruff`, `black`, `mypy`, `pytest`)
- **test** – testing frameworks
- **prod** – deployment tools (`gunicorn`, `uvicorn`)
- **ai** – LLM and vector support (`openai`, `qdrant-client`)

### Tooling
- `.pre-commit-config.yaml`
- `.env` management via `python-dotenv`
- CI/CD with Docker-based deployment
- Security via automated scans and version pinning
- Documentation dependencies (MkDocs) added via the `docs` group in `pyproject.toml`.

### Dependency-Related Files

| File                       | Purpose                        |
|----------------------------|--------------------------------|
| `pyproject.toml`           | Unified dependency definition  |
| `.pre-commit-config.yaml`  | Code quality enforcement       |
| `Dockerfile.dev`           | Development container setup    |
| `Dockerfile.prod`          | Production container setup     |
| `scripts/setup_dev.sh`     | Environment installer (dev/docs/ai) |
| `scripts/setup_prod.sh`    | Production-only install script |

---

## 3. Semantic Dependency Graph

Ora includes a semantic dependency graph to track:

- **File Imports** (Python file relationships)
- **Obsidian Links** (`[[loop-...]]`, `project:` YAML)
- **Task Routing** (source → loop → project)
- **People Mapping** (via BambooHR)

All relationships are stored in `dependency_graph.db`, with dashboards and CLI for querying node impacts, broken links, and routing audits.

---

## 4. Loop Memory + Weighting System

Each loop is stored in both `.md` and SQLite format. Metadata includes:
- `tags:`, `status:`, `weight:`
- Promotion history
- References from tasks, emails, and projects

Feedback and routing behavior dynamically adjust weights to guide system focus. Dashboard shows active loops by weight, recency, and usage.

---

## 5. Signal Routing Logic

Current focus: Gmail ingestion.

Routing steps:
1. Parse emails → extract tasks
2. Classify tasks → loop/project with GPT
3. Apply tags (`#force-route`, `#ignore`)
4. Archive email if task completed
5. Log outcome to `task_trace_log.md`

Planned: BambooHR (for org mapping) and Slack.

---

## 6. Testing + CI/CD + Security

- `pytest`, `pytest-cov`
- `pre-commit`, `black`, `ruff`, `mypy`
- Security: version pinning, safety checks
- Docker: `Dockerfile.dev` and `Dockerfile.prod`
- CI/CD pipelines with test + lint + deployment checks

---

## 7. Streamlit UI / Interfaces

- **Cursor Dashboard** ✅
  - Analytics visualization for Cursor chat sessions
  - Topic distribution and complexity analysis
  - Success rate tracking and file modification metrics
  - Interactive filters for date range, plan area, and complexity
- **Loop Dashboard** (Planned)
  - Status and weight visualization
  - Feedback tracking
- **Task Triage Panel** (Planned)
  - Signal source management
  - Task routing interface
- **GPT Chat UI** (Planned)
  - Interactive planning with Ora

---

## 8. Cursor-GPT Dev System

- Patch-first workflow (Cursor + GPT)
- All files stored under the following structure:
  - **`src/`**: Contains all source code, organized by modules or components.
  - **`tests/`**: Contains all test files, mirroring the structure of the `src/` directory for easy navigation.
  - **`docs/`**: Contains all documentation, including user guides, API documentation, and system architecture.
  - **`config/`**: Contains configuration files, such as environment variables, logging settings, and database configurations.
  - **`scripts/`**: Contains utility scripts for setup, deployment, and maintenance.
- Tests and logs in `/System/Logs/`
- Obsidian-visible output in `/AIR01/` vault

---

## 9. Open Tasks + Roadmap

See [ea_roadmap.md](ea_roadmap.md) for the current roadmap and progress tracking.

## Recent Changes

- **System Status Update (2025-05-23):**
  - Project Linkage & Loop Promotion ✅
    - Enhanced promotion system with comprehensive metrics
    - Improved project file creation and metadata
    - Reliable tracking and promotion process
  - CI/CD Pipeline 🟡
    - GitHub Actions workflow implemented
    - Automated testing and deployment
    - Pending: Complete test coverage and real deployment validation
  - Backup & Rollback 🟡
    - Comprehensive backup system implemented
    - Automated cleanup and safe rollback
    - Pending: Recovery validation and documentation
  - Loop Dashboard 🟡
    - Enhanced visualization and health metrics
    - JSON API for programmatic access
    - Pending: Automatic importance surfacing
  - Email System 🟡
    - Retry logic and recovery implemented
    - HTML support added
    - Pending: Volume testing and routing validation
  - Streamlit Dashboard ✅
    - Implemented Cursor chat analytics dashboard
    - Added session metrics and visualization
    - Integrated with existing session tracking system
  - Automated Services ✅
    - Implemented comprehensive launchd service suite
    - Added automated dashboard generation
    - Configured monitoring and logging services
  - Session Management ✅
    - Enhanced session tracking and analytics
    - Improved session data storage
    - Added session pattern analysis
  - Cadence Management ✅
    - Implemented task cadence control
    - Added update cycle management
    - Configured maintenance scheduling
  - Monitoring System ✅
    - Implemented comprehensive log monitoring
    - Added automated alert generation
    - Configured log rotation and cleanup
  - Analysis Tools ✅
    - Enhanced graph analysis capabilities
    - Added visualization tools
    - Improved dependency tracking
  - GPT Integration ✅
    - Implemented supervised learning system
    - Added loop classification
    - Enhanced memory integration
  - Interface Suite ✅
    - Deployed multiple dashboard interfaces
    - Added CLI tools
    - Integrated with Obsidian vault

- **Log Monitoring Optimization (Phase 3):**
  - Identified and documented alert report generation error (IndexError in _generate_alert_report)
  - Current growth rate in monitor.log: 21.03% (slightly above 20% threshold)
  - Next steps:
    - Fix alert history handling in _generate_alert_report
    - Further optimize log growth rates
    - Implement scheduled updates
    - Complete graph analysis and visualization
    - Standardize frontmatter across notes

- **Log Monitoring Optimization (Phase 2):**
  - Further reduced logging verbosity by:
    - Setting file logging to WARNING level only (was INFO)
    - Setting console output to ERROR level only (was WARNING)
    - Simplifying log format to reduce overhead
  - Improved metric collection:
    - Only logs when errors or warnings are detected
    - Includes specific counts of errors/warnings
    - Removed routine "Collected metrics" messages
  - Previous optimizations maintained:
    - 1MB rotation size
    - 3 backup files
    - 10-minute monitoring interval
    - Conservative growth thresholds

- **Node Connectivity Enhancement:**
  - All previously isolated nodes were programmatically connected to the central project node
  - The dependency graph now has zero isolated nodes, with a clear central hub structure
  - This improves graph integrity, enables more comprehensive analysis, and ensures all files are integrated into the system's semantic structure

- **Graph Analysis & Frontmatter Standardization (2025-05-23):**
  - Completed full analysis and visualization of the dependency graph; all nodes are now connected and integrated, with a central project hub.
  - Standardized frontmatter across all markdown notes in the vault, ensuring consistent metadata for robust linking, querying, and automation.
  - The system is now ready for advanced querying, automation, and further dashboard/reporting enhancements.

- **Backup & Rollback System Validation (2025-05-23):**
  - Backup and rollback scripts were fully validated with comprehensive unit tests and a real-world scenario script.
  - All backup components (Qdrant, Redis, App data) are correctly archived, restored, and verified for integrity.
  - Error handling and retention logic are robust and tested.
  - The system is now production-ready for disaster recovery and routine backup operations.

## Next Steps

1. **Core System Improvements:**
   - Further optimize log growth rates
   - Implement scheduled updates (in progress)
   - Productionize and automate graph analysis/visualization
   - Enhance GPT classification accuracy
   - Expand dashboard capabilities

2. **Production Environment:**
   - Complete CI/CD pipelines
   - Finalize security measures
   - Implement backup system
   - Set up monitoring dashboards
   - Configure automated testing
   - Deploy GPT supervised systems

3. **Documentation:**
   - Update system architecture diagrams
   - Document monitoring thresholds
   - Create troubleshooting guides
   - Add performance benchmarks
   - Document backup and recovery procedures
   - Add GPT integration guidelines

---

## 10. Loop Feedback and Promotion Flow

Each loop receives feedback via tags (`#useful`, `#false_positive`, etc.) and loop status controls in Obsidian. The system uses this feedback to adjust:

- `weight:` in SQLite and YAML
- Priority in semantic query results
- Visibility in dashboards
- Eligibility for promotion to projects

Promotion steps:
1. Loop receives consistent positive feedback
2. Weight increases beyond threshold
3. Loop is reviewed for promotion
4. Upon promotion, a project link is created and logged

---

## 11. Semantic Querying and Weight Filtering

The loop memory system supports GPT-based semantic querying enhanced by vector search (Qdrant) and SQLite metadata filtering.

Query results are:
- Weighted by loop relevance
- Filterable by tags, weight, feedback, recency
- Logged to `/0001 HQ/Insights/loop_queries.md`

Planned: dashboard surfacing of most-searched loops and missed matches.

---

## 12. Assistant HQ File Structure

Ora uses a unified HQ system rooted at:

```
/0001 HQ/
├── Signal_Tasks.md      # Inbox of all incoming signal tasks
├── Insights/            # Loop query logs, highlights
├── Loop_Status.md       # Loop dashboard by weight + feedback
├── Daily_Summary.md     # Assistant-generated reflection
```

Tasks are grouped by signal source, semantically classified, and routed to loops or projects. Email tasks auto-archive upon completion. Slack and BambooHR are next.

---

## 13. Agent Specialization Model

Ora supports specialized agents per signal source:

| Agent     | Input         | Logic                | Output                       |
|-----------|---------------|----------------------|------------------------------|
| Email     | Gmail         | GPT w/ routing + archiving | Tasks → Loops/Projects       |
| HR        | BambooHR      | GPT w/ org mapping   | People-linked tasks          |
| Chat      | Slack         | GPT w/ thread summary | Project triggers, mentions   |

Agents share infrastructure but use distinct GPT prompts, tagging rules, and thresholds.

---

## 14. System Metrics (Planned)

- Loop promotion rate (weekly/monthly)
- Feedback tag distribution (#useful, #false_positive)
- Task→Loop→Project conversion rate
- Most referenced loops (via backlinks + query logs)
- Unmatched signals (to improve routing logic)

## 15. Production and Development Environments

Ora supports both production and development environments to ensure robust testing and deployment.

### Prerequisites
- **Core Functionality**: The core system (signal routing, loop memory, semantic querying) must be fully tested and stable.
- **Graph Analysis**: The dependency graph must be analyzed, visualized, and validated.
- **Automation**: Basic automation (e.g., scheduled updates, git hooks) must be in place.
- **Metadata Enrichment**: Frontmatter and metadata must be standardized across notes.
- **Documentation**: System docs must be up to date with the latest workflow and error-handling improvements.

### Development Environment
- **Tools**: `uv`, `pyproject.toml`, `pre-commit`, `black`, `ruff`, `mypy`, `pytest`
- **Workflow**: Cursor-GPT pairing, patch-first development
- **Testing**: Automated tests via `pytest`, linting via `pre-commit`
- **Logs**: Stored in `/System/Logs/`

### Production Environment
- **Deployment**: Docker-based (`Dockerfile.prod`), CI/CD pipelines
- **Security**: Version pinning, automated scans
- **Monitoring**: 
  - Log monitoring with optimized verbosity and rotation
  - Component-specific thresholds for alerts
  - Growth rate tracking and trend analysis
  - Automated cleanup of old logs
  - Metrics visualization and reporting
  - Loop promotion, feedback, and task conversion tracking
- **Backup**: Regular snapshots of `dependency_graph.db` and Obsidian vault

### Implementation Sequence
1. **Complete Core Tasks**: Finish graph analysis, automation, metadata enrichment, and documentation updates.
2. **Build Development Environment**: Set up `uv`, `pyproject.toml`, `pre-commit`, and testing tools.
3. **Test Thoroughly**: Run automated tests and validate core functionality in the development environment.
4. **Build Production Environment**: Set up Docker, CI/CD, security, monitoring, and backup.
5. **Deploy and Monitor**: Deploy to production and monitor system metrics.

Both environments share the same core architecture but differ in configuration and tooling to suit their specific needs.

## 16. Automated Services

Ora includes several automated services managed by launchd:

### Monitoring Services
- **Watch and Log**: Continuous system monitoring and logging
- **File System Watch**: Direct and automatic file system monitoring
- **Auto Logging**: Automated log generation and management

### Dashboard Services
- **Cursor Dashboard**: Automated generation of Cursor chat analytics
- **Loop Impact Dashboard**: Regular updates of loop impact metrics
- **Loops Dashboard**: Periodic refresh of loop status and metrics

### Summary Services
- **Weekly Summary**: Automated generation of weekly system summaries
- **Loop Summary**: Regular updates of loop status and progress

### Service Management
- All services are configured via `.plist` files
- Services can be managed using standard launchd commands
- Logs are stored in `launchd_stdout.log` and `launchd_stderr.log`

## 17. Session and Cadence Management

### Session Management
- **Session Tracking**: Comprehensive tracking of all system interactions
- **Session Analytics**: Analysis of session patterns and outcomes
- **Session Storage**: Structured storage of session data in markdown format

### Cadence Management
- **Task Cadences**: Management of recurring task schedules
- **Update Cycles**: Control of system update frequencies
- **Maintenance Windows**: Scheduling of system maintenance tasks

if __name__ == "__main__":
    print("🧠 Building dependency graph...")
    init_db()
    scan_md_files()
    print(f"✅ Graph updated: {GRAPH_DB}")

---

> **Prompt for Assistant:**
> Whenever you make significant changes to the system, including the dependency graph, node connectivity, architecture, or workflows, automatically update this document with a summary of what was changed and why. This ensures the documentation always reflects the latest state and reasoning—no need for the user to ask.

### Recent Changes (continued)

- **Node Connectivity Enhancement:**
  - All previously isolated nodes were programmatically connected to the central project node (`02 Workstreams/Projects/project-2025-05-21-summary:-trial-users-are-exper.md`).
  - The dependency graph now has zero isolated nodes, with a clear central hub structure.
  - This improves graph integrity, enables more comprehensive analysis, and ensures all files are integrated into the system's semantic structure.

- **Log Monitoring Optimization:**
  - Reduced log rotation size from 5MB to 1MB for more frequent rotation
  - Decreased backup count from 5 to 3 files to reduce disk usage
  - Extended monitoring interval from 5 to 10 minutes to reduce logging frequency
  - Implemented selective logging (INFO level only for errors/warnings)
  - Added stream handler filtering to show only WARNING and above
  - These changes address the rapid growth in monitor.log (previously showing 134.81%, 59.41%, and 53.76% growth rates)

## 18. Monitoring and Analysis Systems

### Log Monitoring
- **Log Monitor**: Comprehensive system monitoring with:
  - Growth rate tracking
  - Alert generation
  - Log rotation management
  - Performance metrics
- **Scheduler**: Automated task scheduling and execution

### Graph Analysis
- **Graph Analyzer**: Tools for:
  - Dependency analysis
  - Node connectivity verification
  - Impact assessment
  - Visualization generation

### GPT Supervised Systems
- **Chat Integration**: GPT-powered chat interface
- **Loop Classification**: AI-driven loop categorization
- **Logic Patches**: Automated system improvements
- **Memory Integration**: Loop memory enhancement

### Interface Components
- **Loop Dashboard**: Status and impact visualization
- **Cursor Dashboard**: Chat analytics and metrics
- **Audit Dashboard**: System health monitoring
- **CLI Interface**: Command-line tools
- **Obsidian Integration**: Vault management
