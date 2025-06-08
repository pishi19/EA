---
uuid: loop-2025-09-01-task-promotion-path
title: Task Promotion – From Planning Board to Execution Context
phase: 10.0
workstream: system-integrity
status: in_progress
score: 0.9
tags: [task-promotion, planner, execution-bridge, semantic-transfer]
created: 2025-06-07
origin: planning-system
summary: |
  This loop defines the architecture for promoting tasks from the workstream planning board (`workstream_plan.md`) into executable contexts such as loop files (`loop-*.md`) or project task files (`task-*.md`). The goal is to establish a structured, traceable pathway from pre-execution intent to semantic execution context.
---

## Purpose

To create a clear contract between Ora's planning interface (task board) and its execution engine (task executor). Promotion enables tasks to transition from abstract intent to traceable, agentically executed actions—preserving authorship, context, and memory linkages.

---

## ✅ Promotion Model

| From | To |
|------|----|
| `workstream_plan.md` | `loop-*.md` or `task-*.md` under a project |
| `source:` | Updated to reflect new execution parent (loop, phase, project) |
| `status:` | Transitions from `pending` to `promoted` or `in_loop` |
| `log:` | Execution log updated in target file with timestamp and origin |
| `UI view:` | Task disappears from board or shows promoted badge; appears in executor |

---

## ✅ Objectives

- [x] Define promotion handler from planning board to target file
- [x] Update task metadata (`source`, `status`)
- [x] Write task block into target execution file (loop or task)
- [x] Append log in destination file under `## 🧾 Execution Log`
- [x] Mark original in plan as `status: promoted`
- [x] Reflect promoted tasks in the Task Executor UI

## 🔧 Tasks

- [x] Implement task promotion API endpoint (`/api/promote-task`)
- [x] Create promotion destination selection dialog
- [x] Build new loop file creation from promotion
- [x] Add task metadata preservation during promotion
- [x] Implement execution log appending in target files
- [x] Update source plan with promotion status and links
- [x] Add "Plan" badge display for promoted tasks in executor
- [ ] Add batch promotion for multiple tasks
- [ ] Implement promotion rollback capabilities
- [ ] Create promotion audit trail and history

---

## 🧾 Execution Log

- 2025-06-07: Task promotion architecture defined and linked to semantic planner and executor interface
- 2025-09-01: Implemented the task promotion feature.
    - Added "Promote to Execution" button in the Task Board UI.
    - Created a dialog for users to select a promotion destination (new or existing loop).
    - Developed an API endpoint (`/api/promote-task`) to handle the promotion logic, including:
        - Creating new loop files or updating existing ones.
        - Appending the task and an execution log entry to the target file.
    - Updated the source `workstream_plan.md` to mark tasks as `status: promoted` and add a `promoted_to` link.
    - Modified the Task Executor view to display a "Plan" badge for tasks promoted from the workstream plan.

## 🧠 Memory Trace

```json:memory
{
  "description": "Task promotion path established with planning-to-execution bridge",
  "timestamp": "2025-09-01T00:00:00.000Z",
  "status": "completed",
  "executor": "system",
  "context": "Tasks can now be promoted from planning board to execution context with full traceability"
}
```
