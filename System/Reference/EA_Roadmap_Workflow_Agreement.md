
# 📘 EA Execution Source of Truth: Roadmap → Phases Agreement

This document establishes the structural and procedural agreement between the EA_Roadmap.md and EA_Phase_Tracker.md files. It is stored in `/System/Reference/` and governs how execution is scoped, activated, and tracked.

---

## 🔁 Principle of Flow

- All strategic direction and potential execution items **originate** in `EA_Roadmap.md`.
- Only **activated items** from the roadmap are reflected in `EA_Phase_Tracker.md`.
- The roadmap is **manually refined and reviewed**.
- The phase tracker is **updated exclusively via Cursor**, based on roadmap approvals.

---

## 📘 EA_Roadmap.md (Source of Truth)

- Contains all strategic priorities, workflows, and future candidate phases.
- Items are written as numbered checkboxes: `1.1`, `2.3`, `A.1`, etc.
- Structured by intent category (System, Signal, Dashboard, Infrastructure, etc.)
- Review frequency: **monthly or as needed**

---

## 📋 EA_Phase_Tracker.md (Working Tracker)

- Contains only a **subset** of the roadmap: those items promoted to active phases.
- Items must **exactly match** roadmap in numbering, wording, indentation, and checkboxes.
- May include phase metadata (status, dependencies, outputs).
- Updated **only via Cursor** — never manually.

---

## 🔒 Control Rules

| Action                        | Allowed? | Who/What        |
|------------------------------|----------|-----------------|
| Add new item to roadmap      | ✅ Yes   | You / Planning  |
| Add item to phase tracker    | ✅ Yes   | If in roadmap   |
| Update phase tracker         | ✅ Yes   | Only via Cursor |
| Update roadmap from phase    | ❌ No    | Never           |

---

## ✅ Enforcement Checklist

- [ ] No unlisted items appear in `EA_Phase_Tracker.md`
- [ ] Every item in `EA_Phase_Tracker.md` links back to a numbered roadmap item
- [ ] Checkboxes and numbering are **identical** across both files
- [ ] Cursor is the **sole update agent** for the phase tracker
- [ ] Roadmap is reviewed and curated manually

---

## 🧭 Placement
- This file is stored in `/System/Reference/EA_Roadmap_Workflow_Agreement.md`
- Version-controlled manually and subject to change only via manual updates or roadmap review
