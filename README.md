# EA Assistant

## Overview
This project is a GPT-powered local assistant system designed to manage tasks, loops, and feedback. It uses a modular structure to organize code, tests, documentation, and configuration files.

## Folder Structure
- `src/`: Contains all Python source files, organized into subdirectories:
  - `memory/`: Memory-related scripts (e.g., vector memory, loop memory).
  - `ingestion/`: Scripts for ingesting and classifying tasks (e.g., email tasks).
  - `interface/`: User interface scripts (e.g., Streamlit apps).
  - `tasks/`: Task management scripts (e.g., routing tasks to programs).
  - `utils/`: Utility functions and helpers.
  - `gpt_supervised/`: GPT-related scripts for classification and chat.
  - `graph/`: Scripts for building and querying dependency graphs.
  - `yaml/`: Scripts for handling YAML frontmatter and metadata.
  - `loops/`: Scripts for managing loop files and updates.
  - `feedback/`: Scripts for processing feedback tags and reports.
  - `daily/`: Scripts for daily summaries and context building.
  - `tests/`: Test files for the project.

- `docs/`: Documentation files (e.g., system overview, dependency management plan).
- `config/`: Configuration files (e.g., `pyproject.toml`, `.pre-commit-config.yaml`).
- `scripts/`: Utility scripts for automation and setup.
- `logs/`: Log files generated during runtime.
- `data/`: Data-related files (e.g., databases, images).
- `archive/`: Archived or backup files.

## Getting Started
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ea_assistant
   ```

2. **Set up the virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run tests:**
   ```bash
   python -m unittest discover src/tests
   ```

5. **Start the application:**
   ```bash
   python src/interface/streamlit_app.py
   ```

## Contributing
- Follow the folder structure and naming conventions.
- Write tests for new features or changes.
- Update documentation as needed.
- Use the linter (`ruff`) to ensure code quality.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
