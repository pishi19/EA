---
uuid: loop-2025-09-18-human-ora-interaction-index
title: Human-Ora Interaction Index – Tracking Co-Execution, Dialogue, and Source Engagement
phase: 10.1
workstream: workstream-ui
status: planning
score: 0.9
tags: [interaction, co-execution, human-machine, dashboard, sources]
created: 2025-06-07
origin: mission-core
summary: |
  This loop defines the structure, metrics, and UI framework for tracking meaningful interactions between Ora and the human user. It introduces a formal interaction index and dashboard, capturing how reasoning, execution, and feedback flow through the system. Sources (emails, signals, messages) are included as semantic catalysts — inputs that represent work and opportunities to shape the future.
---

## Purpose

To build the foundation of Ora’s mission: a system of transparent, traceable, and meaningful collaboration between human and machine. This loop scopes the creation of a persistent interaction index and UI dashboard that records, visualizes, and surfaces co-execution events — including task creation, chat exchanges, reasoning logs, memory updates, and source-derived opportunities.

---

## ✅ Objectives

- [ ] Define what counts as an interaction (e.g. GPT message, task promotion, feedback, memory write)
- [ ] Design file-based logging format for `interaction-<uuid>.md`
- [ ] Include actor attribution: `user` | `ora`
- [ ] Include source attribution: `from: gmail`, `from: retrospective`, `from: loop`, etc.
- [ ] Create `runtime/interactions/` directory to store indexed entries
- [ ] Build an Interaction Dashboard UI component:
  - List interactions by recency, source, phase, or task
  - Filter by type (memory, chat, task, loop)
  - Summarize user/machine contribution ratios
- [ ] Integrate with scoped ChatPane, TaskBoard, and LoopCards

---

## 💬 Interaction Types

| Type | Example |
|------|---------|
| 💬 Chat exchange | GPT response + human feedback |
| 📌 Task promotion | GPT or user elevates loop or source |
| 🧠 Memory addition | User insight or GPT reflection |
| 🧾 Execution log update | Manual or GPT-triggered |
| 📥 Source engagement | Email parsed → task created → human refinement |

---

## 🧾 Execution Log

- 2025-06-07: Loop created to establish the architecture and UI layer for tracking bidirectional interaction and advancing Ora’s mission of co-execution.
