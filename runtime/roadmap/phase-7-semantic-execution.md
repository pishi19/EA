---
id: 7
phase: 7.0
title: Semantic Execution from Slice to Workstream
priority: high
---

# Ora Phase 7 — Semantic Execution from Slice to Workstream

## 🎯 Objective
Fully implement Ora's slice strategy by stabilizing the Gmail signal path, structuring loop metadata into a SQL-backed model, and surfacing task-based semantic cohesion across workstreams. Phase 7 formalizes the loop-to-roadmap pipeline with feedback-driven scoring and assistant-guided task orchestration.

This phase also operationalizes the core architectural principle:

> **Semantic cohesion across workstreams** — Ora's ability to recognize, align, and orchestrate similar tasks across teams to improve organizational execution and cohesion.

---

## 📦 Foundation from Phase 6
- ✅ Chat UI supports semantic loop memory, feedback tagging, and roadmap promotion
- ✅ Feedback scores stored in SQLite and surfaced in UI
- ✅ Roadmap normalized to `runtime/roadmap/`
- ✅ Slice framing defined (Gmail as proving ground)
- ✅ Project rationale and strategy documents established

---

## ✉️ Phase 7.0 — Gmail Slice Completion
**Goal:** Establish Gmail as the first structured signal source for semantic execution.

- [x] Finalize `origin: gmail` loop creation via GPT
- [ ] Embed Gmail-derived loops into Qdrant with semantic tagging
- [ ] Track message ID, sender, subject, and inferred intent
- [x] Store loops in SQL (`loop_metadata`, `loop_feedback`)
- [ ] Surface in UI with `origin=gmail` and feedback panel
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

- [ ] Integrate Gmail as a signal source

  **Definition of Done:**
  - Authenticate with Gmail (OAuth or service account)
  - Fetch recent messages via Gmail API
  - Parse sender, subject, body, message ID
  - Route selected messages to GPT for loop generation
  - Tag loops with `origin: gmail`, `gmail_message_id`

  **Dependencies:**
  - Gmail API access
  - Message-to-loop conversion pipeline
  - Loop storage (markdown + SQL + Qdrant)

  **Testing:**
  - Run `/test_gmail_ingest`
  - Confirm loop is created, embedded, and tagged

---

## 📊 Phase 7.1 — Workstream-Aware Feedback and Task Scoring
**Goal:** Use workstreams to contextualize feedback and align task patterns.

- [x] Add `workstream:` field to `loop_metadata`
- [x] Feedback buttons (👍/👎) store `tag`, `workstream`, `uuid`, and `timestamp`
- [x] Task verbs extracted from loops via GPT (e.g., `schedule_consultant()`)
- [x] Score tasks within each workstream by feedback signal
- [ ] Identify feedback conflicts across workstreams on same task
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

### 🖥 Workstream UI — Semantic Execution Surface

**Goal:** Build a dedicated UI layer to surface how loops, tasks, and roadmap items align to programs and projects (workstreams). This becomes Ora's primary execution lens — connecting signals to structure.

- [x] Create `Workstream View` in Streamlit with dropdown to select workstream
- [x] Display all associated loops with: uuid, title, score, task, feedback
- [ ] Group and filter tasks by status and semantic similarity
- [ ] Show loop source: Gmail/Slack message preview or link
- [ ] Allow marking tasks complete from the UI
- [x] Display task feedback score + conflict flag
- [ ] Support task assignment: who owns the verb?
- [ ] Enable GPT-suggested workstream classification during loop creation
- [x] Store all metadata in `loop_metadata` + `workstreams.yaml` or SQL

**Dependencies:**
- [x] `loop_metadata` and `feedback_scores.yaml` must be queryable
- [x] `workstreams.yaml` or `workstreams.db` must exist
- Task extraction logic embedded or linked to each loop

**Strategic Importance:**
This is the execution scaffold that turns signals into strategy. It closes the loop from Gmail and Slack back to roadmap and workstream coherence.

---

## 🧠 Phase 7.2 — Semantic Task Matching Across Workstreams
**Goal:** Enable GPT to detect and surface task-level semantic cohesion.

- [x] Index all extracted tasks as vectors
- [x] Show task matches across loops in different workstreams
- [ ] Highlight shared tasks with conflicting feedback
- [ ] Suggest workstream-level task templates
- [x] Build `/task_similarity` assistant command
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

---

## 🔄 Phase 7.3 — Loop-to-Roadmap Promotion by GPT
**Goal:** Let the assistant suggest roadmap entries based on loop patterns and workstream insights.

- [x] Allow GPT to scan recent loops + feedback within a workstream
- [x] Recommend roadmap items based on unaddressed signals or repeated tasks
- [x] Write new `.md` files to `runtime/roadmap/` via `/promote_loop uuid` or `/suggest_roadmap workstream` commands
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

---

## 📘 Phase 7.4 — Semantic Feedback Panel in UI
**Goal:** Expand the loop dashboard with semantic task awareness.

- [x] Show feedback history per loop per workstream
- [x] Render task similarity score
- [x] Highlight loops with no feedback or score volatility
- [x] Filter dashboard by workstream + task verb + score threshold
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

---

## 📈 Phase 7.5 — Workstream Summary + Reflection
**Goal:** Support assistant- and user-driven summarization of a workstream's semantic state.

- [x] `/summarize_stream workstream_id` returns:
  - Task clusters
  - Unaddressed feedback
  - Suggested roadmap deltas
- [x] Enable scoring volatility and reflection log
- [ ] Log insight density and verb trends
- [ ] Add built-in verification step to every roadmap execution prompt

  **Definition of Done:**
  - All roadmap-related prompts (e.g. `mark_task_done`, `create_loop_from_task`) include a `verify:` step
  - Verification checks:
    - File mutation confirmed (`.md` updated as expected)
    - Log entry appended (`phase_execution_log.yaml`)
    - Assistant/GPT context realigned (via memory or checkpoint)

  **Testing:**
  - For each prompt, include a test block in `.cursor/prompts/ora_execution.yaml`
  - Run through simulated prompts and confirm expected file diffs and output
  - Add a `/test_prompt` mode or CI job if Git-integrated

  **Dependencies:**
  - `.cursor/prompts/ora_execution.yaml` must exist
  - `runtime/phase_execution_log.yaml` must be writable
  - Assistant must be able to parse roadmap `.md` state (for `/where_am_i` and `/next_in_phase`)

  **Version Control:**
  - All updates to prompt definitions must be committed to Git
  - Add tag: `📌 prompt-verification-standard` in commit message

---

## 🤝 Phase 7.6 — Cross-Program Semantic Coordination

**Goal:** Detect, highlight, and support coordination between related programs and projects led by different product managers.

- [ ] Enable semantic cohesion across projects with shared goals or tasks

  **Definition of Done:**
  - Extend `loop_metadata` with `owner` and `program`
  - Embed task descriptions and compare across streams
  - Compute task similarity scores between loops
  - Detect high-similarity tasks in different workstreams
  - Surface coordination suggestions in UI and GPT assistant
  - Highlight feedback conflicts on shared verbs across teams

  **Dependencies:**
  - `workstreams.yaml` must include `owners`
  - Task embeddings must exist and be refreshed
  - UI must display loop/task similarity across streams

  **Testing:**
  - Simulate 2 PMs working on similar tasks
  - Confirm detection, score, and assistant suggestion
  - Validate loop-level linking and UI highlight

  **Strategic Value:**
  - Promotes cross-functional alignment
  - Identifies duplicative work
  - Encourages reuse and convergence

---

## 🧩 Data Model Changes
- `loop_metadata(uuid, title, origin, workstream, score, status)`
- `loop_feedback(uuid, tag, workstream, timestamp)`
- `tasks(uuid, workstream, verb, vector, source_loop_id)`
- `task_similarity(uuid1, uuid2, score)`

---

## 📍Alignment to Strategy
This roadmap implements:
- Slice framing as a means to system evolution
- Workstream assignment as core metadata
- Feedback contextualization by stream
- Semantic cohesion across loops and verbs
- Roadmap generation as an assistant-supported reasoning layer

---

Phase 7 defines the transition from slice-level ingestion to workstream-level orchestration — turning Ora into a system that reasons across execution, not just records it.