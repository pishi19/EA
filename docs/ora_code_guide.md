# Ora Code Guide

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