---
title: Ora Roadmap Slice – Human-Ora Co-Execution Model
scope: roadmap-architecture
status: active
created: 2025-06-07
type: planning
tags: [workstream, planning, roadmap-slice]
---

## 🎯 Purpose

This document reflects the current active roadmap slice from Phase 8.1 through 10.3, reformulated around Ora’s emerging co-execution model. It captures the evolution from task execution and UI rendering into semantic orchestration, persistent memory, and human-Ora collaboration — with interaction now serving as the primary metric of system success.

---

## ✅ Active Roadmap Tasks

### ✅ Phase 8.1 – Task Executor UI
- [x] Scaffold TaskExecutor.tsx component
- [x] Promote loop tasks via GPT trigger
- [x] Render loop/task context in UI

### ✅ Phase 8.2 – Contextual Execution
- [x] Load loop metadata from frontmatter (phase, workstream, score)
- [x] Support scoped GPT logic tied to filePath

### ✅ Phase 8.3 – Memory Trace Reasoning
- [x] Enable appendToSection() for ## 🧠 Memory Trace
- [x] Display reasoning trace within loop/task views

### ✅ Phase 8.4 – Test Infrastructure
- [x] Jest + TS test coverage for loop/task components
- [x] Snapshot and interaction tests for core execution surfaces

### ✅ Phase 9.0 – GPT Agent Task Generation
- [x] Generate next tasks from memory trace
- [x] Log GPT-created actions in loop files

### ✅ Phase 10.0 – Mutation Surface Hardening
- [x] validateMarkdownSchema()
- [x] dryRunMutation() and full file audit (100% loop compliance)

### ✅ Phase 10.1 – Contextual Chat Architecture
- [x] Scoped ChatPane with filePath + UUID support
- [x] Persist messages to ## 💬 Chat and memory trace
- [x] Fully dynamic loop integration across 60+ files

---

## 🧭 Phase 10.2 – Human-Ora Interaction Index
- [ ] Define `interaction-*.md` format with actor + source attribution
- [ ] Create `runtime/interactions/` and begin appending logs
- [ ] Embed interaction tracking into ChatPane, TaskCard, LoopCard
- [ ] Build Interaction Dashboard UI (filters, ratios, timeline)
- [ ] Link sources (emails, signals) into interaction index

---

## 🔭 Phase 10.3 – Source-as-Opportunity Engine
- [ ] Parse incoming signals as semantic prompts (Gmail, Slack, etc.)
- [ ] Propose tasks/loops from sources using co-execution model
- [ ] Enable GPT + human review of signal → execution conversion
- [ ] Embed sources into feedback loop and phase planning

---

## 🔧 System Threads
- [ ] Surface active loop/phase context in sidebar + context bar
- [ ] Enable strategic loop view: see which planning loop authored current phase
- [ ] Align ChatPane, Memory Trace, and Execution Log per loop/task/phase

