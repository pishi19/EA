
# 📊 EA Signal Dashboard – Feature Overview

The Streamlit dashboard in `ui/inbox.py` provides a real-time overview of your signal classification, triage, and loop activity across all programs.

---

## 🧠 Purpose

The dashboard is designed to:
- Give immediate visibility into the state of the EA loop memory
- Show triage backlog and ambiguity across programs
- Surface reclassification trends and system coverage
- Support decision-making around signal health and loop quality

---

## 📋 Features

### 📈 System Metrics
- **Total loop files** in `vault/`
- **Loops requiring triage** (`triage_required: true`)
- **Ambiguous loops** (`ambiguity: true`)
- **Total reclassifications** (from `triage_log.json`)

### 📊 Loops by Program
- Horizontal bar chart of loop counts by `program`

### 🗂️ Loops by Program + Project
- Table showing counts per project within each program

### 🕒 Recent Reclassifications
- Table of most recent reclassification actions, with:
  - Loop file name
  - Original program/project
  - New program/project
  - Timestamp

---

## 🧪 Data Sources
- `vault/`: loop markdown files
- `triage_log.json`: logs of triage actions
- `config/programs/`: source of all program/project logic

---

## 📁 File Location
```
ui/inbox.py
```

---

## 🔜 Planned Enhancements
- Date range filter (e.g., show past 7 days)
- Priority-weighted backlog view
- Export dashboard snapshot as markdown or image
- Summary agent integration (e.g., "Summarize CRM Migration loop backlog")

---

## 🔖 Version
First included in `v0.1` (tagged)

Fully functional and visually integrated.
