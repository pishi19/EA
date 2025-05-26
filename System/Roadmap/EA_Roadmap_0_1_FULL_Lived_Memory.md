### 🔹 0.1 Memory & Loop Infrastructure

Ora’s memory subsystem is designed to track what matters across time. It’s the core mechanism through which execution, context, and feedback are retained, reasoned over, and evolved. At its center are loop files — structured markdown documents that represent the system’s living awareness: what it’s currently doing, what it has done, and what’s coming next.

Each loop is stored in `/Retrospectives/`, with a filename based on the creation date and a short identifier (e.g. `loop-2025-05-25-mecca-coordination.md`). Loop files contain YAML frontmatter (metadata), checklist-based tasks, feedback tags, internal notes, and reference links to their origin — typically an email, a chat message, or a contact interaction. Loops are not simply logs. They’re units of active reasoning, updated by system logic and user feedback, and used to drive decisions, actions, and reflections.

Ora rebuilds its memory each morning at 5:05 AM using `daily_refresh.py`. This script re-indexes loop metadata, calculates loop freshness and weight, and determines which loops need to be promoted, closed, or refreshed. Weights are affected by time decay, user tags, classifier outcomes, and task completion. This daily pass generates `loop_status.md`, which is used as the active memory dashboard by Streamlit and GPT-based interfaces.

Loops are embedded semantically using Qdrant, allowing for contextual retrieval across concepts, not just filenames. The structured metadata is also stored in SQLite for programmatic access, filtering, and integration with routing, roadmap traceability, and feedback audit logs. Every loop created from a signal is also linked to its origin via a session log file — creating an end-to-end trace from input to state.

Streamlit exposes memory visually through a dashboard and chat interface. Users can:
- Ask Ora questions like “Which loops are stale?”, “What feedback was received last week?”, or “Summarize the status of the Mecca program.”
- See graphs of loop weights, freshness timers, and tag usage trends
- Identify loops with malformed YAML, missing roadmap references, or no clear feedback path
- View retrospectives and daily churn

Obsidian is used to manually inspect, update, and shape loops. Users can:
- Create new loop files from scratch or from signals
- Edit frontmatter to change roadmap references, contact roles, tags, or weight
- Add or check off tasks using markdown checkboxes
- Embed source tracebacks to emails or CRM records
- Annotate loops with signal correction, contact reclassification, or routing overrides

Example use case: The Mecca program. Ailo runs in-store events with Mecca, involving internal team coordination, external partner alignment, and invitee communications. Signals flow in via email, including confirmations, changes, RSVPs, asset approvals, and campaign planning. Each contact — internal, partner, invitee — carries a semantic role. When a signal arrives (e.g. “Sophie from Mecca confirms the Melbourne event”), the classifier routes it to a loop tagged with the `partner` role and `roadmap: 2.2`.

A loop created from this might look like:

---
id: loop-2025-05-24-mecca-coordination
title: Confirm Mecca Retail Event Dates
roadmap: 2.2
tags: [partner, feedback, #useful]
weight: 0.62
---

## Checklist
- [x] Confirm Oct 12 store availability
- [ ] Add RSVP list to CRM
- [ ] Send invite brief to Sophie

## Notes
Confirmed via Sophie’s email. RSVP list due by Oct 5. Tag this for Invitee Coordination.

## Related
source: session_logs/email-2025-05-24-sophie-confirmation.md

Users can give feedback directly within loop files using either checkboxes or YAML. This teaches the system how to refine its classifications, adjust weights, and update contact roles. Feedback may include signal reinforcement, reclassification, or reassignment:

## 🔧 Signal Review
- [x] Reinforce this loop
- [ ] Not relevant
- [ ] Reclassify contact as: prospect
- [ ] Move loop to: Invitee CRM Project

YAML alternative:

signal_feedback:
  - reinforce
  - reclassify: prospect
  - notes: "This contact is a prospective partner, not Mecca staff."

These corrections are parsed during the next memory refresh and integrated into classifier training data, contact role reassignment, loop weighting, or roadmap reassignment. If feedback conflicts with system assumptions (e.g. a partner marked as a prospect), the system logs the discrepancy for review.

The user is not required to manage memory. They’re invited to observe, ask, and occasionally intervene. They use Streamlit when they want to see system state or ask for summaries. They use Obsidian when they want to repair something, tag it, or reflect. And they use chat when they want insight drawn from memory, without needing to browse it directly.

A loop is never destroyed — only closed, archived, or merged. Its trace remains, its feedback is retained, and its effect on system structure is visible. Over time, as signal accumulates, the assistant’s understanding of which loops are important improves — not from rules, but from lived patterns.

The memory system transforms signal into context, and context into action. It connects roadmap to execution, people to programs, and reasoning to structure. It is the first and most essential subsystem of Ora’s awareness.
