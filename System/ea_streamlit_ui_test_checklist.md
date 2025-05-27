
# ✅ EA Signal System – Streamlit UI Test Checklist
**Generated:** 2025-05-26 10:48:00

---

## 📥 Inbox Tab

- [x] Loop cards display program/project, priority, confidence
- [x] 📩 Signals and ✅ Tasks render correctly from markdown
- [x] Confirm button updates triage_required in YAML
- [x] Reclassify dropdown updates program/project and logs change
- [x] GPT and Stub summaries both generate correctly
- [x] Feedback section writes to summary_feedback in YAML

---

## 📊 Dashboard Tab

- [x] Program/project loop counts render correctly
- [x] Triage and ambiguity counts reflect current filters
- [x] 📤 Export snapshot button generates markdown report
- [x] 📈 Ambiguity trend chart updates by week
- [x] 💬 Summarize All Missing button triggers GPT and updates YAML
- [x] 📈 Retrain Low-Quality Summaries re-runs GPT and logs retrained loops

---

## 🧠 Ora Chat Tab

- [x] Rule-based queries (5 types) filter loops as expected
- [x] 📤 Export Chat Results button generates markdown
- [x] Query history stores and replays last 5 entries
- [x] 💬 GPT Response returns correct content (with fallback on error)
- [x] Streaming GPT response shows token-by-token update

---

## 🛡 Stability

- [x] No Streamlit crashes on invalid query or GPT failure
- [x] All button clicks are idempotent or clearly confirmed
- [x] YAML updates maintain required schema fields
- [x] All exports written to `vault/0001 HQ/` with correct timestamp

---

## 🔍 Optional Future

- [ ] Add unit tests to validate loop_writer and summary_agent behavior
- [ ] Add UI snapshot testing for layout changes
- [ ] Implement persistent session memory for query history

