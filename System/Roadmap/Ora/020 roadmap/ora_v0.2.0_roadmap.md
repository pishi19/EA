# Ora v0.2.0 Roadmap – Loop Intelligence and Insight Expansion

## 🎯 Goal
Upgrade Ora from a reactive triage assistant to an intelligent, insight-surfacing loop manager. This version emphasizes loop feedback integration, GPT-powered insight generation, editable YAML triage, and program/project level dashboards.

---

## 🧠 Core Upgrades

### 1. 🔄 Feedback Pipeline
- [ ] Parse `#useful`, `#false_positive`, `#ambiguous` tags from reflections
- [ ] Score loop files weekly and persist scores
- [ ] Influence roadmap weighting or sorting based on scores
- [ ] Add `loop_feedback.py` to run daily

### 2. 📊 Program & Project Dashboards
- [ ] Group loops by `program` / `project`
- [ ] Aggregate status, scores, and outstanding items
- [ ] Add sidebar filters for program, priority, and status
- [ ] View tasks by triage state (open, confirmed, ignored)

### 3. 📝 Editable YAML in UI
- [ ] Load YAML metadata into editable Streamlit fields
- [ ] Allow live editing and re-saving to `.md` files
- [ ] Flag untriaged or invalid YAML content

### 4. 🧠 LLM-Powered Insight Generation
- [ ] Add `generate_insight_from_loop()` in `gpt_insights.py`
- [ ] Run LLM pass on selected loops
- [ ] Suggest YAML metadata (tags, title, priority)
- [ ] Write output to `vault/Retrospectives/Insights/`

### 5. 🔁 Vault Watcher (Optional)
- [ ] Detect new `.md` loop files in `vault/`
- [ ] Auto-index or prompt user triage
- [ ] Trigger GPT summary or classification

---

## 📦 Engineering Infrastructure

### CI / Testing
- [ ] Add `pytest` tests for loader functions
- [ ] Add `streamlit.testing.v1` tests for render functions
- [ ] Add `.test_vault/` for fixtures

### Deploy
- [ ] Snapshot Droplet before rollout
- [ ] Validate all modules on new branch `v0.2.0-dev`
- [ ] Tag release as `v0.2.0` after QA

---

## ✅ Summary
Ora v0.2 will evolve the assistant into a continuous loop intelligence system. The foundation is strong; this version will build higher-order capabilities around summarization, feedback intelligence, and editable task reflection.

Next steps:
- [ ] Create `v0.2.0-dev` branch
- [ ] Begin work on Feedback Pipeline
- [ ] Sync roadmap and retrospective logs into test vault
