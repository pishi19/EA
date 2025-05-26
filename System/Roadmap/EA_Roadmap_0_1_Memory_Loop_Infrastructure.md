### 🔹 0.1 Memory & Loop Infrastructure

#### 🔭 Purpose
This subsystem maintains Ora’s semantic memory — the structured, evolving representation of what the system knows, has done, and is considering. It allows for reasoning across time, continuity between sessions, and a grounded view of execution state. It tracks loops, feedback, weights, signals, and retrospectives, making the system not just reactive but aware.

#### 🧱 Composition
The memory subsystem is composed of structured markdown files, Python agents, logs, and indexes that together form the persistent record of execution in Ora. It includes:

- **Loop Files (`/Retrospectives/loop-*.md`)**: Each loop is a single `.md` file containing YAML frontmatter, checklist tasks, feedback tags, timestamps, and backreferences.  
- **`loop_memory.py`**: Scores and tracks loop freshness and weight based on tags and interaction.  
- **`loop_status.md`**: A daily roll-up summarizing loop weight, activity, and staleness — used for system-wide coordination.  
- **`session_logs/structured/`**: Captures signals that led to loop creation or update.  
- **`daily_refresh.py`**: Consolidates memory each morning — applying feedback, updating weights, and closing stale loops.  
- **`streamlit_chat_interface.py`**: Ora’s conversational UI for querying memory.  
- **`gpt_memory_interface.py`**: Supports GPT-based summarization, reflection, and loop interaction.

#### 🧠 Memory Integration
- All loops are embedded semantically into Qdrant for vector search and reflection.
- Metadata and frontmatter (YAML) are indexed in SQLite for fast filtering, updates, and joins with signal traces.
- Memory is refreshed each day by `daily_refresh.py`, which:
  - Adds new signal tags
  - Updates weights
  - Archives stale or completed loops
  - Recalculates summaries and freshness indicators

#### 📊 Streamlit Integration
- **Loop Memory Dashboard**
  - 📈 Loop weight distribution chart
  - 🟡 List of stale loops by age
  - 🧭 Loop freshness clock with countdown to review threshold
- **Retrospective Summaries**
  - Churn heatmaps across tags and time
  - Loop creation/closure timeline
- **YAML Validator**
  - Detects malformed frontmatter
  - Reports missing fields (e.g. `goal:`, `roadmap:`)
- **Ora Chat Panel**
  - Conversational interface that queries loops, summaries, and feedback history
  - Planned: actuation like `pause this loop`, `summarize last week`, `show all stalled tasks`

#### 🧑‍💻 User Expectations
- **Clarity**: See what the system is working on — and what it has forgotten.
- **Insight**: Quickly surface important, neglected, or high-feedback loops.
- **Trust**: The system remembers everything unless you archive it.
- **Access**: Able to inspect loop memory through a natural conversational interface (Ora chat).
- **Delegation**: Able to eventually offload action ("promote this", "pause that") to the interface, not manual editing.

#### 🔄 Feedback/Control Loops
- Promotes loops automatically based on weight and tag patterns.
- Inputs from classifiers and signals update loops in memory via feedback tags (e.g. `#useful`, `#false_positive`).
- Archival or pausing decisions reflect memory staleness metrics.
- Cursor or GPT may propose loop merges, closures, or updates based on structure.

#### 🧩 Why It Exists
This subsystem gives Ora coherence and continuity. Without it, the assistant becomes reactive, stateless, and forgetful. Loop memory ensures that action is always contextual, history is always present, and feedback becomes cumulative intelligence. It transforms a reactive task list into a living reasoning environment.
