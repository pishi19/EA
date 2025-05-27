
# 🔖 Release: v0.3 – Ora GPT Memory Integration

**Date:** 2025-05-27 00:26:58
**Tag:** `v0.3`

---

## 🧠 Key Features

### 💬 GPT-Powered Summarization
- GPT-4 generates loop summaries from signals + tasks
- Supports both stub and GPT modes with full YAML tracking
- Summaries update in real time with source attribution

### 📝 Summary Feedback System
- Users can rate summaries (1–5)
- Flag summaries for review
- Leave comments directly in UI
- Feedback is written to loop YAML

### 🔁 Summary Retraining
- Batch retrain summaries using GPT if:
  - Flagged for review
  - Rated 3 or lower
- Logs retrained loops and updates YAML trace

### 📤 Summary & Feedback Export
- Export summaries across all loops
- Export feedback logs (`summary_feedback-*.md`)
- Export retrained summary log (`summary_retraining_log-*.md`)

### 🧠 Ora Chat (v1.0)
- Structured query interface: “summary review”, “rated below 3”, “recent summaries”
- GPT response: injects loop memory into prompt
- Streaming token-by-token response in UI
- Query history sidebar with one-click re-run
- Export Ora Chat results to markdown

---

## 📁 Tag Location

This version should be tagged in Git as `v0.3`.

All tests pass.  
System is stable, loop-aware, and LLM-enhanced.

Ready for live Gmail ingestion and dynamic memory interfaces.
