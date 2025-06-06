---
uuid: phase-7.0-gmail-loop-creation
title: "Finalize `origin: gmail` loop creation via GPT"
phase: 7.0
workstream: ora_self_execution
status: open
origin: roadmap
---

Ensure Ora can create a `loop.md` from a parsed Gmail message.

Requirements:
- Loop file should include `origin: gmail`
- Metadata must include sender, subject, and source message ID
- GPT should structure content semantically and tag suggested workstream
- Output should be persisted to `runtime/loops/` and indexed into Qdrant 