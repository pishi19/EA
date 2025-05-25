# EA System Overview

## Overview

EA Assistant is a GPT-powered local assistant system designed to automate and streamline various tasks.

## Folder Structure

- `src/`: Contains all Python source files, organized into subdirectories.
- `docs/`: Documentation files (e.g., system overview, dependency management plan).
- `config/`: Configuration files (e.g., `pyproject.toml`, `.pre-commit-config.yaml`).
- `scripts/`: Utility scripts for automation and setup.
- `logs/`: Log files generated during runtime.
- `data/`: Data-related files (e.g., databases, images).
- `archive/`: Archived or backup files.

## Dependency Management

- Dependencies are managed using `pyproject.toml` and `requirements.txt`.
- Use `pip install -r requirements.txt` to install dependencies.

## Logging

- Logging is configured in the `src/utils/logging.py` file.
- Adjust the logging level and format as needed.

## Testing and CI/CD

- Tests are written using `pytest`.
- CI/CD is managed using GitHub Actions.
- Pre-commit hooks are used to ensure code quality.

## Recent Changes

- **YAML/Frontmatter Fixes**: Automated and manual fixes were applied to resolve YAML/frontmatter errors in markdown files.
- **Dependency Graph Update**: The dependency graph is now fully up to date, with all files processed and no YAML errors.
- **Test Infrastructure Implementation**: Added unit tests, validation suite, integration tests, and best practices.

## Automation and Scripts

- **Makefile**: Contains targets for common tasks like setting up the project, running tests, and linting.
- **Version Bumping**: Use `python scripts/bump_version.py [major|minor|patch]` to bump the version and update the changelog.
- **Dependency Updates**: Use `python scripts/update_deps.py` to update dependencies to their latest versions.
- **Automated Releases**: GitHub Actions workflow for automated releases when a tag is pushed.
