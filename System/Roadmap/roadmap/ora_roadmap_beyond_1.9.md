# 🔮 Ora Roadmap Beyond Phase 1.9

These roadmap phases represent Ora's transition from a deployed semantic assistant to an adaptive, intelligent agent with multi-phase awareness and federated reasoning.

---

## 🔟 2.0 – Semantic Phase Orchestration

### 🎯 Goal:
Enable Ora to understand roadmap phases and align behavior to phase status.

### 🧩 Scope:
- Track `phase.yaml` across roadmap files
- Embed phase ID in `status.json` and `vault_index.json`
- GPT evaluation: does this loop/insight belong to active phase?
- Roadmap panel to switch, lock, and close phases via UI

---

## 🔁 2.1 – Feedback Influence Model

### 🎯 Goal:
Turn feedback tags into meaningful loop weights and promotion logic.

### 🧩 Scope:
- Weekly aggregate scores for:
  - `#useful`
  - `#false_positive`
  - `#ignored`
- Adjust loop visibility and order
- Promotion and archiving recommendations

---

## 🧠 2.2 – Auto-tagging and Contextual GPT Insights

### 🎯 Goal:
Use GPT to auto-generate and refine insight metadata from loop content.

### 🧩 Scope:
- LLM tags insights with:
  - `program`, `priority`, `feedback`, `score`, `roadmap_linkage`
- Extract structure from raw markdown
- Improve accuracy with loop context chains

---

## 🌐 2.3 – Federated GPT-Aided Collaboration

### 🎯 Goal:
Enable multi-user perspective (Ash, Isaac, partner reps) within Ora’s logic and GPT responses.

### 🧩 Scope:
- `author_id` and `role` tagging
- Personas: engineer, PM, founder
- GPT prompt shifts based on role context
- Role-aware loop routing

---

## 🚀 2.4 – Ora-as-Agent

### 🎯 Goal:
Empower Ora to proactively suggest, triage, and manage roadmap items.

### 🧩 Scope:
- GPT logic detects:
  - orphaned roadmap items
  - uninsighted loops
  - feedback signal decay
- Auto-propose:
  - loop promotions
  - roadmap task creation
  - retrospective gaps

---
