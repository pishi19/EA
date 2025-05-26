# Ora Code Guide

## Recent Updates

- **System Reliability and Chat History Improvements (2025-05-25):**
  - Fixed and reloaded all launchd service paths to ensure correct execution and logging.
  - Implemented a robust chat history module with persistent storage, supporting save, load, list, and delete operations.
  - Added comprehensive unit tests for all chat history features, ensuring reliability and maintainability.
  - Improved session ID generation to guarantee uniqueness, preventing accidental overwrites.
  - Established a working test suite and coverage reporting.

## Overview

This guide provides coding standards and best practices for the Ora project.

## Coding Standards

- Follow PEP 8 guidelines.
- Use meaningful variable and function names.
- Write tests for all new features.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🧠 Purpose
This document helps onboard Ora development into Cursor or any GPT-enhanced IDE. It defines how we write, test, and integrate code into the Executive Assistant (Ora) system.

---

## 📁 Project Structure

```
/Users/air/ea_assistant/
├── mcp_memory/
│   ├── interface/
│   ├── database/
│   └── utils/
├── signal_sources/
│   ├── gmail/
│   ├── bamboohr/
├── tasks/
├── feedback/
├── tests/
├── archive/
└── system/
```

---

## 🔄 Workflow Model

1. **GPT-4o (Ora HQ)** handles:
   - Planning
   - YAML schema design
   - Loop memory modeling
   - Outputting zipped code + install/test blocks

2. **Cursor (Ora Code)** handles:
   - Editing and validating code
   - Local testing
   - Code execution and debugging

---

## 🧪 Testing Pattern

Each file includes:
- Unit tests (in `/tests/`)
- Shell install and test command blocks
- Coverage tracking and validation logs

Use a daily `Test Log.md` to record:
- What was tested
- What passed/failed
- What changes were made

---

## ✅ Install/Test Block Template

```bash
mv ~/Downloads/module_name.zip ~/ea_assistant/
cd ~/ea_assistant/
unzip -o module_name.zip
python3 test_module_name.py
```

---

## Streamlit Dashboard & Ora Chat (2025)

- Main dashboard file: `src/cursor_dashboard.py`
- To run locally:
  ```bash
  streamlit run src/cursor_dashboard.py
  ```
- Set your OpenAI API key for Ora Chat:
  ```bash
  export OPENAI_API_KEY=sk-...
  ```
- To extend the dashboard:
  - Add new pages to the `page = st.sidebar.radio(...)` list.
  - Add new logic in the corresponding `if page == ...:` block.
  - Use session state for chat or other interactive features.

---
