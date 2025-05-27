# Collaborative YAML Layer Design Doc

This document outlines how we can collaboratively evolve the YAML-based loop structure in Ora, balancing Ash's current PKM workflow in Obsidian with the emerging need for a team-ready, UI-driven interface.

---

## 1. Objective

Create a unified YAML contract that:
- Works natively in Obsidian for PKM and individual workflows
- Powers Ora's internal logic and GPT classification
- Serves as the foundation for a collaborative team UI
- Is schema-compatible, editable, and diffable

---

## 2. Design Principles

| Principle          | Reason |
|--------------------|--------|
| **Flat & Explicit** | Easy to read, diff, and merge |
| **Minimal Required Fields** | Supports fast capture and GPT-first creation |
| **Frontmatter-Only** | Body remains uncluttered for notes and messages |
| **Schema-Driven** | Allows UI to validate inputs |
| **Tag-Friendly** | Supports tag-based search, dashboards, and prompts |

---

## 3. Loop YAML Schema (Draft v0.3)

```yaml
---
loop_id: loop-2025-05-27-vip-confirmation
program: Sales
project: Mecca Store Nights
status: active         # [new, active, blocked, done, archived]
type: signal           # [signal, task, decision, person, goal]
source: slack          # [gmail, slack, manual, system, obsidian]
channel: "#mecca-ops"  # Optional: only if source is Slack
people:
  - jane-smith
  - ali.reza
tags:
  - "#signal/invite"
  - "#task/followup"
  - "#priority/high"
weight: 0.92
ambiguity: 0.10
feedback: pending       # [useful, false_positive, pending, inaccurate]
related_loops:
  - loop-2025-05-12-mecca-brief
  - loop-2025-05-15-vendor-quote
last_updated: 2025-05-27T14:05:00
---
```

The body of the loop contains:
- Slack/Gmail thread summary
- GPT-generated interpretation
- Attached notes or compressed history

---

## 4. PKM vs UI-Oriented Notes

| Area         | Obsidian PKM             | Team UI                          |
|--------------|--------------------------|----------------------------------|
| Capture      | Freeform, inline tags     | Form-driven, schema-validated    |
| Updates      | Manual edits, hotkeys     | Button-based, traceable          |
| Loop Creation| Daily notes, GPT triggers | Slack/Gmail ingestion, manual    |
| Review       | Backlinks, file views     | Dashboards, filters, checklists  |
| Trust Model  | Personal, high context    | Team-readable, permission-aware  |

---

## 5. Collaboration Strategy

### Step 1: Iterate YAML Schema
- Test in live loops
- Capture edge cases and UI conflicts
- Create schema in `/System/Schema/loop.yaml`

### Step 2: Build UI Spec from YAML
- Define Figma or HTML wireframes
- Map YAML fields to UI components (editable tags, dropdowns)

### Step 3: Design Merge + Sync Logic
- Ora detects changes at field level (e.g. weight, feedback)
- Push/Pull sync modes between PKM and team system
- Log diffs to `/System/Logs/loop_changes/`

### Step 4: Define Loop Lifecycle
- Draft status transitions:
  - `new → active → done/archived`
- Define triggers for status changes:
  - Feedback received
  - Tasks checked off
  - External signal confirmed

---

## 6. Next Steps

- Finalize schema for `loop.yaml`
- Draft team UI slice from schema
- Define status workflows and system reactions
- Write spec for sync/merge logic