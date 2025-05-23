# Ora System Master Plan

## 1. Architecture Overview

Ora is a modular executive assistant system that integrates semantic memory (Qdrant), structured logic (SQLite), and contextual awareness across signals (email, Slack, BambooHR), routing tasks into loops, projects, and dashboards inside an Obsidian vault. 

### Key Components
- **Signal Ingestion**: Gmail API, iMessage, Slack (planned)
- **Memory Layer**: Qdrant (vector), SQLite (loop/task/project database)
- **Classification & Routing**: GPT-based, with confidence thresholds and trace logs
- **Feedback & Validation**: `#useful`, `#false_positive` tags, loop promotions
- **Interface**: Obsidian-driven dashboards, Streamlit UI
- **Development Flow**: Cursor-GPT pairing, with testable, modular CLI and pre-commit enforced code quality

---

## 2. Dependency Management Plan

Ora uses a consolidated `pyproject.toml` structure with pinned dependencies.

### Dependency Groups
- **dev** – development tools (`ruff`, `black`, `mypy`, `pytest`, `pytest-cov`)
- **prod** – deployment tools (`gunicorn`, `uvicorn`, `python-dotenv`)
- **ai** – LLM and vector support (`openai`, `qdrant-client`, `faiss-cpu`)
- **ui** – interface components (`streamlit`, `ruamel.yaml`)
- **logging** – logging tools (`loguru`, `structlog`)

### Tooling
- `.pre-commit-config.yaml` for code quality
- `.env` management via `python-dotenv`
- CI/CD with GitHub Actions
- Security via automated scans and version pinning
- Logging with structured format

### Current Dependencies
```toml
[project]
dependencies = [
    "openai==0.28.0",
    "qdrant-client==0.8.0",
    "faiss-cpu==1.7.4",
    "numpy==1.24.3",
    "streamlit==1.22.0",
    "ruamel.yaml==0.17.21",
    "loguru==0.7.0",
    "structlog==23.1.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.0.292",
    "black>=23.0.0",
    "mypy>=1.5.1",
    "pre-commit>=3.0.0",
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0"
]
prod = [
    "gunicorn>=21.0.0",
    "uvicorn>=0.15.0",
    "python-dotenv>=1.0.0"
]
```

---

## 3. Semantic Dependency Graph

Ora includes a semantic dependency graph to track:

- **File Imports** (Python file relationships)
- **Obsidian Links** (`[[loop-...]]`, `project:` YAML)
- **Task Routing** (source → loop → project)
- **People Mapping** (via BambooHR)

All relationships are stored in `dependency_graph.db`, with dashboards and CLI for querying node impacts, broken links, and routing audits.

### Graph Management
- Automated updates via CI/CD
- Regular validation of links and relationships
- Visualization tools for dependency analysis
- Impact assessment for changes

---

## 4. Loop Memory + Weighting System

Each loop is stored in both `.md` and SQLite format. Metadata includes:
- `tags:`, `status:`, `weight:`
- Promotion history
- References from tasks, emails, and projects
- Creation and modification timestamps
- Source tracking and validation

Feedback and routing behavior dynamically adjust weights to guide system focus. Dashboard shows active loops by weight, recency, and usage.

### Memory Components
- Vector memory for semantic search
- SQLite for structured data
- File-based storage for markdown
- Logging for audit trails

---

## 5. Signal Routing Logic

Current focus: Gmail ingestion.

Routing steps:
1. Parse emails → extract tasks
2. Classify tasks → loop/project with GPT
3. Apply tags (`#force-route`, `#ignore`)
4. Archive email if task completed
5. Log outcome to `task_trace_log.md`

### Planned Integrations
- BambooHR (for org mapping)
- Slack (for team communication)
- Calendar (for scheduling)
- Task management systems

---

## 6. Testing + CI/CD + Security

- `pytest`, `pytest-cov` for test coverage
- `pre-commit`, `black`, `ruff`, `mypy` for code quality
- Security: version pinning, safety checks
- GitHub Actions for CI/CD
- Automated testing and linting
- Security scanning and dependency updates

### CI/CD Pipeline
```yaml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    - name: Run tests
      run: |
        python -m unittest discover src/tests
    - name: Run linter
      run: |
        pip install ruff
        ruff check src/
```

---

## 7. Streamlit UI / Interfaces

- Loop dashboard (status, weight, feedback)
- Task triage panel (signal sources)
- GPT chat UI (interactive planning with Ora)
- System health monitoring
- Log viewer and analyzer

### UI Components
- Navigation sidebar
- Interactive panels
- Real-time updates
- Error handling and feedback
- Responsive design

---

## 8. Development System

- Patch-first workflow (Cursor + GPT)
- All files stored under `/ea_assistant/src/` and `/System`
- Tests and logs in `/System/Logs/`
- Obsidian-visible output in `/AIR01/` vault
- Documentation in `/docs/`

### Development Tools
- Cursor IDE integration
- GPT-assisted development
- Pre-commit hooks
- Automated testing
- Documentation generation

---

## 9. Open Tasks + Roadmap

| Area | Next Steps | Status |
|------|------------|--------|
| Dependencies | Finalize `pyproject.toml`, test clean install | In Progress |
| Loop Memory | Add weight impact metrics, CLI filter for top N | Planned |
| Signal Routing | Slack + BambooHR support, improve trace logs | Planned |
| Dashboards | Build Streamlit loop + task dashboards | In Progress |
| Feedback | Integrate feedback weighting into routing engine | Planned |
| Logging | Implement structured logging across all components | In Progress |
| Testing | Increase test coverage, add integration tests | In Progress |
| Security | Regular dependency audits, API key management | Ongoing |
| Documentation | Update all docs, add API documentation | In Progress |

---

## Recent Changes

- **YAML/Frontmatter Fixes:**  
  - Automated and manual fixes were applied to resolve YAML/frontmatter errors in markdown files.  
  - Scripts (`auto_fix_frontmatter.py`, `build_dependency_graph.py`) were updated to handle common issues and report skipped files.  
  - Reports (`skipped_files_report.md`, `still_skipped_files.md`) were generated to track progress.

- **Dependency Graph Update:**  
  - The dependency graph (`dependency_graph.db`) is now fully up to date, with all files processed and no YAML errors.  
  - Scripts for building and summarizing the graph (`build_dependency_graph.py`, `summarize_dependency_graph.py`) are operational.

- **Logging Implementation:**
  - Added structured logging across key components
  - Implemented log rotation and management
  - Added error tracking and monitoring
  - Created log analysis tools

- **Code Organization:**
  - Reorganized files into logical directories
  - Updated import paths and dependencies
  - Added type hints and documentation
  - Improved error handling

---

## Future Improvements

### Documentation
- Create API documentation
- Add development guides
- Update system architecture docs
- Create troubleshooting guides

### Testing
- Increase test coverage
- Add integration tests
- Implement performance testing
- Add security testing

### Development
- Improve error handling
- Add more type hints
- Optimize performance
- Enhance logging

### Infrastructure
- Set up monitoring
- Improve CI/CD pipeline
- Add deployment automation
- Enhance security measures