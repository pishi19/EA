# 🔁 EA Cycle Review Templates

Templates for running daily, weekly, and monthly review cycles in the EA system. These serve as repeatable workflows to monitor execution, phase progression, and systemic integrity.

---

## 📅 Daily Review (Execution Loop)
**Trigger:** 5:05 AM (via `daily_refresh.py`)

### Checklist:
- [ ] Generate/refresh `loop_status.md`
- [ ] Update or create today's `Retrospectives/loop-YYYY-MM-DD.md`
- [ ] Sync feedback tags (`#useful`, `#false_positive`) into loop weights
- [ ] Check for incoming signals (email, BambooHR)
- [ ] Log signal-to-loop matches in `session_logs/structured/`
- [ ] Confirm `system_log.md` exists and has new entries

### Output:
- ✅ Updated dashboard
- ✅ New or updated loop file for today
- ✅ Signals classified or triaged

---

## 📆 Weekly Review (Phase + Feedback)
**Trigger:** Sunday night / Monday morning

### Checklist:
- [ ] Open `EA_Phase_Tracker.md`
- [ ] Review active phase checklist progress
- [ ] Archive any completed phases
- [ ] Promote loops to projects (if tagged `#needs-promotion` or high weight)
- [ ] Review feedback from the week
- [ ] Run validator (`ea_validate_integrity.py`) to check structure
- [ ] Update `system_state_view.md` with current status

### Output:
- ✅ Phase tracker updated
- ✅ Feedback loops promoted or closed
- ✅ Structural integrity validated

---

## 🗓 Monthly Review (System Alignment)
**Trigger:** 1st of month (or last working day)

### Checklist:
- [ ] Scan for inactive or stalled loops
- [ ] Identify any `project/` files with no active loop linkage
- [ ] Generate retrospective report from archived loops
- [ ] Review `EA_Phase_Tracker.md` for phase transitions
- [ ] Archive outdated planning documents
- [ ] Update vision / roadmap files if needed

### Output:
- ✅ Loop backlog surfaced
- ✅ Strategic phase priorities realigned
- ✅ System memory rotated + clean slate defined
