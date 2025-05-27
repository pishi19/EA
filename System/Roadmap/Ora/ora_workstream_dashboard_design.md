# Ora Workstream Dashboard Design

This document defines the structure, logic, and narrative behavior for Ora’s integrated workstream dashboards. These dashboards unify performance metrics (via MCP), qualitative signal analysis (via Ora's loop memory), and executive reasoning to produce a single actionable view per program/project.

---

## 1. Purpose

To provide a live, contextual view of workstream health that answers:
- Are we on track?
- What’s driving our performance?
- Where are we exposed?
- What actions should we take next?

---

## 2. Architecture Overview

**Data split:**

- **Quantitative layer (via MCP):**
  - Revenue, targets, variances
  - Month-over-month performance
  - P&L metadata
- **Qualitative layer (via Ora):**
  - Loops (status, feedback, tags)
  - People
  - Signals and blockers
  - GPT-inferred narrative summaries

---

## 3. Unified Dashboard Schema (`dashboard.yaml`)

```yaml
---
program: Sales
project: Mecca Store Nights
owner: jane-smith
month: 2025-05

financials:
  target: 340000
  actual: 298400
  variance: -41600
  currency: AUD

loops:
  active: 7
  blocked: 3
  done: 12
  feedback_pending: 4
  total: 26

people:
  - jane-smith
  - ali.reza
  - laura.chan

top_tags:
  - "#signal/invite"
  - "#priority/high"
  - "#person/ali.reza"

untriaged_loops:
  - loop-2025-05-27-invite-delay
  - loop-2025-05-26-comms-gap

related_goals:
  - increase VIP conversion
  - activate Chadstone store
  - improve supplier readiness

linked_loops:
  - loop-2025-05-23-invite-approval
  - loop-2025-05-24-supplier-delay

suggested_actions:
  - escalate supplier delay loop
  - triage untagged signal from Slack
  - request feedback on onboarding loop

status: underperforming  # [on_track, underperforming, critical]
last_updated: 2025-05-27T10:20:00
---
```

---

## 4. GPT Prompt for Ora’s Narrative

```text
You are Ora, an executive copilot.

The user is viewing the monthly dashboard for the project "Mecca Store Nights" under the Sales program. They want to understand performance and what should happen next.

Here's what you know:

- Revenue target: $340,000
- Actual revenue: $298,400 (–$41,600 variance)
- 7 loops are active, 3 are blocked, 4 are pending feedback
- Common tags include #signal/invite, #priority/high, and #person/ali.reza
- Related loops include loop-2025-05-24-supplier-delay and loop-2025-05-23-invite-approval
- Goals include: improve VIP conversion and activate Chadstone store

Generate a narrative summary that includes:
- A performance overview
- Root causes or risks
- Suggestions for action
- Optional tone: strategic, sharp, and aligned with Ash’s executive mindset
```

---

## 5. Sample Narrative Output

> **Summary:**  
> The Mecca Store Nights workstream is currently underperforming with a $41,600 revenue shortfall against the May target. Key contributors to the gap include unresolved supplier delays and unconfirmed event invites, both reflected in 3 blocked or untriaged loops. VIP activation is lagging, and onboarding steps remain unconfirmed.

> **Root Causes:**  
> - Legal and supplier signoff delays  
> - Incomplete feedback on onboarding loops  
> - High-priority signals left untagged in Slack

> **Recommended Actions:**  
> 1. Escalate `loop-2025-05-24-supplier-delay` to program owner  
> 2. Request immediate feedback on onboarding loop  
> 3. Triage and classify `loop-2025-05-27-invite-delay`

> **Strategic Note:**  
> This shortfall is not systemic, but early intervention will prevent further spread. Consider linking Legal explicitly to this project’s review cadence.

---

## 6. UI Application

### Dashboard should render:
- P&L summary (pulled via MCP)
- Loop status breakdown (pulled via Ora)
- Top signals, tags, and unresolved loops
- People load (active loop counts)
- Ora's GPT-generated summary and follow-up checklist

---

## 7. Next Steps

- Finalize MCP API or spreadsheet integration
- Automate dashboard file generation per project/month
- Hook dashboard into triage and retrospective loops
- Expand GPT prompts with timeline and performance memory