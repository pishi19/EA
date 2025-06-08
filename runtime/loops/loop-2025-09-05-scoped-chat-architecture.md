---
uuid: loop-2025-09-05-scoped-chat-architecture
title: Scoped Chat Architecture – Hierarchical Interaction Contexts
phase: 10.0
workstream: system-integrity
status: in_progress
score: 0.9
tags: [chat, memory, hierarchy, reasoning, logging]
created: 2025-06-07
origin: semantic-scaffolding
summary: |
  This loop defines Ora's scoped chat architecture. Each level of the execution hierarchy (workstream, program, project, task) will maintain its own `chat.md` file or section to support context-bound interaction. This allows user-GPT conversations to remain attached to their semantic parent and inform future reasoning.
---

## Purpose

To implement conversational context that is tied directly to execution units. This architecture ensures that GPT-generated insights, questions, and decisions are scoped correctly and logged alongside the task or context they relate to.

---

## ✅ Chat Scope Model

| Level | Chat Location |
|-------|----------------|
| Workstream | `/runtime/workstreams/{name}/chat.md` |
| Program | `/runtime/workstreams/{ws}/programs/{pg}/chat.md` |
| Project | `/runtime/workstreams/{ws}/programs/{pg}/projects/{proj}/chat.md` |
| Task | Inside `task-*.md` as `## 💬 Chat` block |

All chats should:
- Be read+write enabled
- Persist conversational history
- Be GPT-readable and user-visible
- Support UI-level rendering scoped to the corresponding level

---

## ✅ Objectives

- [ ] Create a file structure and loader to access `chat.md` files or task-embedded blocks
- [ ] Define a chat data model (timestamp, speaker, message, optional loop/task ref)
- [ ] Render chat inline with task/project/program/workstream views in the UI
- [ ] Enable GPT to query the appropriate chat scope when suggesting or responding
- [ ] Support markdown log structure for long-term persistence

---

## 🧾 Execution Log

- 2025-06-07: Scoped chat architecture initiated for structured, contextual interaction across execution hierarchy

## 🔧 Tasks

- [ ] Design scoped chat architecture for contextual conversations
- [ ] Implement chat context isolation by workstream/project
- [ ] Create chat history persistence and retrieval
- [ ] Build chat integration with loop and task systems
- [ ] Add real-time messaging capabilities
- [ ] Implement chat search and filtering
- [ ] Create chat export and archival features

## 🧠 Memory Trace

```json:memory
{
  "description": "Scoped chat architecture initiated for contextual communication",
  "timestamp": "2025-06-07T00:00:00.000Z",
  "status": "initiated",
  "executor": "system",
  "context": "Building isolated chat contexts for workstream and project-specific communication"
}
```
