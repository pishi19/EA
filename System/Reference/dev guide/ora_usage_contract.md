# 🤖 Ora Usage Contract

## What Ora Manages

- Roadmap-linked features
- Loop-based memory structure
- Streamlit UI module routing
- GPT prompt scaffolding and storage
- Vault structure, YAML parsing, and file linkage
- Deployment scripts (`launch_streamlit.sh`, `ora.service`)
- System state snapshot (`status.json`)
- Module ↔ roadmap linkage (`roadmap_registry.py`)

---

## What You Declare via Prompts

- “Create a feature tied to roadmap 2.2”
- “Write a test for the feedback scoring module”
- “Add a UI component to edit YAML in loop files”
- “Generate a prompt that summarizes insights from loops”
- “Build a dashboard view linked to roadmap 1.3”

---

## What You Never Do Manually

- Create or edit files directly
- Manually update Streamlit routing
- Write GPT logic without prompt registry
- Modify roadmap files outside of prompt logic
- Bypass `data_loader.py` for vault access
- Deploy without using Ora’s tools

---

## Team Practice with Ora

1. All features must trace to `vault/Roadmap/*.md`
2. All Streamlit views must map to a roadmap ID in `roadmap_registry.py`
3. All generated prompts must live in `prompts/`
4. All system state changes must reflect in `status.json`

---

## Why This Matters

This is not just a repo. It’s a system.

Ora is a working assistant built with traceability, reflection, and system integrity at its core.

Every part of Ora **must know where it came from, what it does, and how it will be tested**.
