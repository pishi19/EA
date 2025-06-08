---
uuid: phase-7.1-workstream-ui
title: Build Workstream UI to define programs and projects as semantic targets
phase: 7.1
workstream: ora_self_execution
status: open
origin: roadmap
---

Create a Streamlit UI page for managing workstreams.

Requirements:
- Allow creation of workstreams via a structured interface
- Each workstream represents a program or project
- Store data in `workstreams.yaml` or `workstreams.db`
- UI must list all associated loops
- Support filtering by tags, feedback score, and semantic similarity
- Allow GPT to suggest workstream matches during loop creation 