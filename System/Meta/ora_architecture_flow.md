
# Ora System Flow – Architecture Overview (Text Diagram)

Ora is designed to extract and structure organizational signal through a loop-based semantic pipeline.
This document outlines the full flow from unstructured input to roadmap-aligned insight.

---

## 🧠 System Flow

```
[SOURCES]
  ├── Gmail
  ├── Slack
  ├── Meeting Notes
  └── Other Org Signals
        ↓

[SIGNAL PARSER]
  - Classifies signal
  - Tags it (program/project, type, #useful, etc.)
  - Extracts summary + metadata
        ↓

[LOOP GENERATOR]
  - Converts parsed signal into a loop file (YAML-fronted .md)
  - Adds weight, feedback tags, and timestamp
        ↓

[LOOP MEMORY]
  ├── YAML loop files (in vault)
  └── Metadata in SQLite DB (`loop_memory.db`)
        ↓

[PROGRAM / PROJECT ASSIGNMENT]
  - Loops routed into structured workstreams
  - Tracked via folders + program tags
        ↓

[DASHBOARD VIEW (Streamlit UI)]
  ├── Loop Slice View
  ├── Program Alignment View
  ├── Feedback Summary (e.g., #useful / #false_positive counts)
  └── Roadmap Influence View
        ↓

[MCP LOOP – META-COGNITIVE PIPELINE]
  - Analyzes tag trends
  - Promotes loops to roadmap items
  - Adjusts loop weights and prioritization
  - Feeds back into loop creation logic
        ↺

[FEEDBACK ENTRY POINTS]
  - Users tag loops (or their summaries) as:
    → #useful
    → #false_positive
    → #requires_attention
        ↑
```

---

## 🌐 Supporting Systems

- `.system_manifest.yaml`: Tracks all file changes and ensures no silent drift
- `validate_manifest_hashes.py`: Confirms integrity of manifest state
- `create_ora_snapshot.py`: Git + timestamped snapshot tagging
- `EA_Phase_Tracker.md` + `system_state_view.md`: Execution + reflection logs
