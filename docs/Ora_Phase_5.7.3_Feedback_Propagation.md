# Ora Phase 5.7.3 — Feedback Propagation and Semantic Reinforcement

## 🎯 Objective
Extend Ora's semantic chat capabilities by reinforcing feedback into its semantic layer. This phase connects user-tagged feedback to:
- Real-time loop embedding updates
- Feedback score weighting
- Dynamic influence over roadmap prioritization
- Semantic context retrieval

## 🧱 Scope
This phase introduces the following core behaviors:

1. **Automatic Qdrant Re-embedding**
   - Triggered by successful `/feedback` or `/promote` commands
   - Reads the mutated `.md` file
   - Re-embeds loop content using OpenAI Embeddings
   - Performs targeted `upsert` to Qdrant using the same `uuid`

2. **Feedback Score Propagation**
   - Loop tags like `#useful`, `#false_positive`, `#needs_context` increment/decrement YAML-based scores
   - Scores are stored in `feedback_scores.yaml`
   - Updated scores inform `workstream_loader.py` weighting logic

3. **Impact on Semantic Search**
   - Optional: re-rank top search results based on feedback scores
   - Adjust ordering or display priority using weighted combination: `similarity * feedback_weight`

4. **Manifest Drift Check**
   - Each mutation logs a `reindexed` timestamp in `system_manifest.yaml`
   - Prevents out-of-sync state between files and Qdrant vector storage

## 🧪 Initial Task: Re-embedding Logic

Design `reembed_loop_by_uuid(uuid: str)`:
- Loads loop `.md` file from disk
- Extracts frontmatter and content
- Embeds content via OpenAI
- Upserts to `workstream_items` in Qdrant
- Logs success/failure to stdout or `embedding_log.txt`

## 🔁 Event Hooks
- `tag_loop_feedback()` and `promote_loop_to_roadmap()` should call `reembed_loop_by_uuid()`
- Log each feedback-tagged loop UUID to a feedback trace log

## 📂 Affected Files
- `src/semantic/loop_mutations.py`
- `src/semantic/reembedding.py` (new)
- `src/data/feedback_scores.yaml`
- `src/data/workstream_loader.py`
- `system_manifest.yaml`

## 🔜 Next Steps
1. Implement `reembed_loop_by_uuid()`
2. Call re-embedding inside mutation functions
3. Add feedback score tracker
4. Integrate score into semantic sorting logic
5. Reflect scores in dashboard and roadmap 