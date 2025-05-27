# 🧠 Ora Roadmap Execution System

This document defines the **systemic architecture**, **execution flow**, and **automation principles** for Ora’s roadmap. It is designed to maintain clarity, avoid needless refactors, and support deep re-evaluation when needed.

---

## 🔁 System Overview

### 🎯 Purpose
To evolve the Ora roadmap from a static planning document into a **self-aware execution system** — integrating semantic metadata, memory-aware actions, automated prompt generation, and contextual dashboards.

### 🔗 Core Flow

```
ea_roadmap.md ─▶ Cursor UI ─▶ Prompt Generation ─▶ Execution ─▶ Reflection Loop
      ▲               │                    │                  │                  │
      │               ▼                    ▼                  ▼                  ▼
    Ora Review ◀──── GPT Memory ◀────── Status Tracking ◀──── Feedback Summary
```

- **`ea_roadmap.md`** is the source of truth (human-readable, structured)
- **Cursor UI** parses and displays roadmap items in live views
- **Prompt Generator** creates GPT instructions from roadmap features
- **Execution layer** (via Cursor) runs GPT output against target files
- **Reflection Loops** are created post-execution for retrospectives
- **Status updates** (Prompt Saved, Executed) are written back to the roadmap
- **Ora memory** stores loop context, file relations, and feedback

---

## 🧩 Component Breakdown

### 1. `ea_roadmap.md`
- Format: Markdown with structured headers
- Fields:
  - `ID`, `Feature`, `Status`, `Priority`, `File Target`
  - `Prompt Saved`, `Executed`, `Instructions`
- Updated manually now, later auto-updated by Ora based on actions

### 2. Cursor UI (`src/cursor_dashboard.py`)
- Tabs:
  - `Roadmap`: Edit + generate prompt
  - `🧠 Reorient Me`: Shows current/next + prompt/execution state
- Pulls directly from `ea_roadmap.md`
- Future: Buttons to update `Prompt Saved` / `Executed` automatically

### 3. Prompt Generator (`prompt_builder.py` planned)
- Input: A roadmap item dict
- Output: Clean GPT prompt file for Cursor
- Path: `prompts/{ID}_prompt.txt`

### 4. Ora Navigator (`ora_navigator.py` planned)
- Parses roadmap
- Displays status digest: last touched, next up, status counts
- Will eventually trigger automatic reminders

### 5. Retrospective Loops
- Triggered when an item is `Executed: Yes`
- Auto-generate loop file in `Retrospectives/`
- YAML frontmatter links to roadmap ID and target file

---

## 📡 Automation Touchpoints

| Event | Trigger | Action |
|-------|---------|--------|
| Prompt Generated | Button click | Update `Prompt Saved: Yes` |
| File Executed | Manual confirm or Git diff detected | Update `Executed: Yes` |
| Weekly Review | Time-based (cron) or on wake | Ora runs `ora_navigator.py` and prompts reflection |
| Reflection Needed | After execution | Ora generates retrospective loop template |

---

## 🧠 Ora Prompts: When to Challenge the Roadmap

Ora should occasionally re-engage Ash with high-context questions:

```markdown
🔁 Ora Check-in

"You have 4 items marked planned, and 3 completed. Two have no feedback loop. Would you like to:
- Reprioritize upcoming features?
- Promote a retrospective on 1.0 (Feedback Weighting)?
- Add a loop to track impact of 1.3 (Chat Routing)?"
```

---

## 🧭 Design Principles

- **Clarity over convenience** – roadmap should explain itself to both human and LLM
- **Declarative, not imperative** – roadmap items declare *what*, not *how*
- **Reversible by default** – status and state can be toggled without side effects
- **Semantically structured** – fields designed to be GPT-native
- **Feedback-driven** – executed items should push retrospectives and improvement
- **System-oriented** – not just "did we build it?" but "does the system now understand it?"

---

## ✅ Next Steps

- [ ] Implement `prompt_builder.py`
- [ ] Add button toggles for `Prompt Saved`, `Executed`
- [ ] Generate first retrospective loop after an executed item
- [ ] Design Ora prompt cadence for roadmap re-evaluation
- [ ] Build dashboard slice (tabular roadmap + status + reflection hooks)

---

> "The roadmap is not a checklist. It’s the contract between architecture and evolution."

– Ash, Ora Founder
