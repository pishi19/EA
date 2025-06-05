
# Comparison: Ora System vs. ai-dev-tasks (Cursor-based Workflow)

This document compares the structure, goals, and implementation details of the Ora project against the `ai-dev-tasks` repository and workflow model (e.g. PRD → tasks → AI execution in Cursor).

---

## 🎯 Core Intent

| Aspect              | ai-dev-tasks                           | Ora System                                          |
|---------------------|-----------------------------------------|-----------------------------------------------------|
| Primary Goal        | Decompose product features into steps for GPT-powered code generation | Extract signal from noisy org channels and turn it into structured, actionable insight |
| Modality            | Cursor `.mdc` command files, step-by-step | Prompt-only GPT architecture, full memory + UI model |
| Output              | Code features, via Cursor’s AI agent    | Semantic insight loops → roadmap impact             |

---

## 🧱 System Architecture Comparison

| Component                 | ai-dev-tasks                     | Ora System                              | Overlap |
|---------------------------|----------------------------------|------------------------------------------|---------|
| Prompt Execution Format   | `.mdc` command files in Cursor   | Prompt-based logic injection into files  | 🟠 Partial |
| State Persistence         | Stateless (per PRD/task cycle)   | Full memory: `.system_manifest.yaml`, Git, logs | 🔴 Minimal |
| Feedback & Validation     | Manual checkbox after each step  | Feedback tags (`#useful`, etc.), loop weights | 🟠 Partial |
| Signal Parsing (Gmail/Slack) | ❌ Not supported              | ✅ Core mission                           | 🔴 None |
| Dashboard Surface         | None                             | Streamlit dashboards + Inbox + Roadmap   | 🔴 None |
| Workstream Modeling       | None                             | Full Program/Project structure           | 🔴 None |
| Meta-Reasoning / MCP      | ❌                               | Phase 4.0 roadmap                        | 🔴 None |
| Loop Model / YAML Logic   | ❌                               | Central logic structure                  | 🔴 None |

---

## ✅ Shared Strengths

- Emphasize prompt-based step-by-step control
- Encourage AI collaboration through constrained execution
- Reduce large cognitive loads by breaking down tasks

---

## 🔍 Key Distinctions

- **ai-dev-tasks is code-centric**, Ora is **signal-centric**
- **ai-dev-tasks uses Cursor as UI**, Ora builds its own
- **ai-dev-tasks is tactical**, Ora is strategic and systemic

---

## 🧠 Potential Integrations

| Idea from `ai-dev-tasks`    | Potential Use in Ora                     |
|-----------------------------|-------------------------------------------|
| `.mdc` pattern              | Use for loop generator prompts or inbox parsers |
| PRD → task flow             | Use to scaffold structured loop derivation from signal |
| Task checklist logic        | Use to show task formation within dashboard views |

---

## 🏁 Summary

Ora is not a development automation tool. It’s a reasoning assistant — designed to think through, extract, and structure knowledge. While `ai-dev-tasks` offers a tactical framework for code generation, Ora builds a strategic intelligence layer over org-wide communication and program logic.

They share a philosophy — but Ora aims to be the system that **understands**, not just builds.
