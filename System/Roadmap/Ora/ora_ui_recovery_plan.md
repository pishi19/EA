# Ora UI Recovery + Droplet Deployment Plan

## Phase 0 — Code Audit & Bomb Defusal

**Purpose:** Ensure no silent failures, hardcoded paths, or legacy dependencies remain.

### Deliverables:
- Path audit (`read_text()`, `System/Reference`, `Users/air`)
- Import audit (e.g. `gpt_supervised`, broken modules)
- File usage audit (unused scripts, orphaned logic)
- Streamlit UI audit (nonfunctional views, fragile state)

**Outcome:**  
Markdown report of all hazards  
Fix plan for each category  
Clean slate for scaffolding

---

## Phase 1 — Modular Scaffold (Ora UI Rebuild)

**Purpose:** Migrate UI into modular, testable, and deployable structure.

### Deliverables:
- `ora_ui.py` — clean Streamlit entrypoint
- `src/data/` — roadmap, reflection, task loaders
- `src/ui/` — rendering components (roadmap, dashboard, chat)
- `tests/` — sanity checks on loading and basic views
- Optional `src/utils/` — GPT, path safety, prompt builders

**Outcome:**  
All legacy logic preserved, all UI rebuilt clean  
Streamlit runs cleanly with `streamlit run ora_ui.py`

---

## Phase 2 — Local Recovery Testing

**Purpose:** Validate the new UI end-to-end with real content.

### Checklist:
- [ ] Roadmap items load
- [ ] Reflections parse + tag group correctly
- [ ] Dashboard summary + charts work
- [ ] GPT Chat (stubbed or real) functional
- [ ] No legacy file references
- [ ] Errors are clear and recoverable

**Outcome:**  
Stable Ora UI on local dev with real data  
Confidence in full self-contained functionality

---

## Phase 3 — Droplet Deployment

**Purpose:** Deploy Ora UI on a production environment (DigitalOcean or similar).

### Steps:
- Provision droplet (Ubuntu, Python 3.9+)
- Clone repo, create `.venv`, install Streamlit
- Run with:
  ```bash
  streamlit run ora_ui.py
  ```
- (Optional) set up `systemd` or `nohup` for persistent running

**Outcome:**  
Ora available at `http://<droplet-ip>:8501`  
Same UI as local, same codebase

---

## Phase 4 — Memory + Admin UX Layers

**Purpose:** Reintroduce intelligent loop memory, tagging, task promotion.

### Deliverables:
- `admin/` tab in UI
- Real GPT prompt injection and generation
- Weighting debug views
- Task-to-project promotion flow
- History logs or loop state viewer

**Outcome:**  
Ora can introspect and evolve. Memory works again.

---

## Phase 5 — Roadmap Ownership & Expansion

**Purpose:** Let Ora control the roadmap, reflect, and adjust system config.

### Ideas:
- YAML roadmap editing inside UI
- Loop-based weight changes reflect in roadmap
- Auto-suggestion of new roadmap items
- GPT prompt-based roadmap block creation

---

## Summary Table

| Phase | Name                        | Goal                           | Output                        |
|-------|-----------------------------|--------------------------------|-------------------------------|
| 0     | Audit & Cleanup             | Defuse hardcoded bombs         | Markdown audit report        |
| 1     | Modular Scaffold            | Rebuild UI in clean structure  | Full working `ora_ui.py`     |
| 2     | Local Recovery              | Validate end-to-end function   | Streamlit UI running locally |
| 3     | Droplet Deployment          | Go live on remote host         | Live public URL              |
| 4     | Memory & Admin Tools        | Restore assistant power        | GPT tagging, weighting, logs |
| 5     | Roadmap as Interface        | Make roadmap user-facing       | Editable, generative UI      |