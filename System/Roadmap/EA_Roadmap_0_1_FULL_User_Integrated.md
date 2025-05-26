### 🔹 0.1 Memory & Loop Infrastructure

Ora’s memory system is the structured reflection of what the assistant is working on, has seen, and is currently considering. It gives Ora continuity, semantic grounding, and long-term coherence. Without this subsystem, Ora would be reactive, stateless, and forgetful — a surface-level chatbot, not a reasoning companion.

Memory in Ora is built from loop files — markdown documents stored in `/Retrospectives/`. Each loop represents a unit of ongoing reasoning: a task under consideration, a feedback thread, or an active piece of signal that requires attention. Loops are structured with YAML frontmatter, checklist-based tasks, metadata tags, timestamps, and backlinks to their origin sources. They exist as both persistent state and active work surface.

The loop memory is regenerated every morning at 5:05 AM by `daily_refresh.py`, which re-indexes all active loops. This script updates loop weights based on accumulated feedback (e.g. `#useful`, `#false_positive`), refreshes timestamps, closes stale loops, archives completed ones, and calculates semantic drift. It generates a daily summary in `loop_status.md`, which acts as the operational dashboard for memory — but the truth remains in the loops themselves.

All loop files are embedded into Qdrant for semantic search and GPT-based reflection. Their structured metadata is tracked in SQLite for fast lookup, indexing, and integration with signals, contacts, and roadmap alignment. The assistant's ability to answer questions about the system — “What’s active?”, “What’s stalled?”, “What’s changed since last week?” — all draws from this memory structure.

The user sees this memory in multiple ways, depending on their context. When using Streamlit, they see a high-level dashboard: bar charts of loop weights, timers showing freshness decay, YAML validator reports, and summaries of recently added or archived loops. They interact with Ora via a conversational panel — asking questions like “Which loops have stalled?”, “Summarize feedback on CRM outreach”, or “What’s unresolved from last week’s partner work?”. The assistant draws responses directly from memory — not from code, but from lived structure.

In Obsidian, the user works directly with memory. They can create a new loop by adding a file in `/Retrospectives/`, filling out the YAML frontmatter to align it with a roadmap item, and adding checklist tasks or internal notes. Tags like `#useful`, `#needs-promotion`, or `#archive-ready` affect downstream logic. A loop file might contain contact metadata, references to session logs, backreferences to projects or programs, and embedded analysis. The user edits loops here to correct routing, update context, or add feedback based on real-world interactions.

A sample loop might look like this:

---
id: loop-2025-05-25-mecca-partner-confirmation
title: Confirm Mecca retail dates
roadmap: 2.2
tags: [partner, crm, #useful]
weight: 0.61
---

## Checklist
- [x] Confirm Melbourne store timing
- [ ] Finalize invitee list and send to Sophie
- [ ] Add RSVP link to CRM campaign

## Notes
Sophie confirmed Oct 12. We need RSVP names by Oct 5. Link this loop to Invitee Coordination.

## Related
source: session_logs/email-2025-05-24-sophie-confirmation.md

When feedback needs to be applied, the user can annotate the loop with checkboxes or structured YAML. These signals are picked up by the next memory refresh and used to modify loop state, adjust classifier behavior, or retrain signal mappings. Feedback can include reinforcement, reclassification, or even proposed reassignment of the loop.

## 🔧 Signal Review
- [x] Reinforce as important signal
- [ ] Not relevant
- [ ] Reclassify contact: prospect
- [ ] Move loop to: Invitee CRM Coordination

Or as structured YAML:

signal_feedback:
  - reinforce
  - reclassify: prospect
  - notes: "Sophie is actually a contact in our CRM, not a Mecca rep."

The assistant doesn't forget. Unless a loop is explicitly archived, its weight will decay naturally — or be refreshed if touched. All task history, feedback loops, tags, and connections remain accessible and auditable. GPT responses draw from this loop data, and nothing is injected or hallucinated that doesn't exist in the system.

From the user’s perspective, memory is visible, actionable, and increasingly predictive. You can query it. You can train it. You can correct it when it’s wrong — and it will adjust. But you do not need to maintain it manually. It lives because you act.

When the system works well, the user rarely sees loop files directly. They work from Streamlit to monitor, from chat to query, and from Obsidian to intervene — but the memory system remains coherent and trustworthy whether they check in or not.

Loop memory is the execution context for Ora. It tracks what’s real. It transforms signals into threads, feedback into weight, and structure into insight. Everything that matters passes through it — and if it doesn’t, it probably wasn’t real.
