
# 💬 EA Loop Summary Agent – Step 13

**Date:** 2025-05-26 10:21:25

---

## 🧠 Objective

Introduce LLM-based summarization into the EA signal pipeline to populate the `summary:` field in loop YAML files.

---

## 🔧 Scope

- Parse all `📩 Source Signals` and `✅ Tasks` from a loop file
- Generate a 1–2 sentence summary that captures the loop’s intent, signals, and current task state
- Write this to the `summary:` field in the loop YAML
- Show inline in UI (Inbox + Dashboard)
- Optionally regenerate summary via a button

---

## 🧱 Approach

1. **Signal Extraction**
   - Extract all signal subjects and trimmed bodies from the markdown body
   - Optionally include most recent `✅ Task` headlines

2. **Stub or GPT-Generated Summary**
   - Start with a stub (join subjects + task list into a sentence)
   - Later upgrade to GPT-4 prompt to generate abstracted insight

3. **Update YAML**
   - Add or update `summary:` field
   - Optionally add `summary_generated_at: <timestamp>`

4. **UI Display**
   - Show summary in a collapsible section below loop metadata
   - Add “💬 Regenerate Summary” button (optional)

---

## 🔁 Future Extensions

- Summary confidence scoring
- Language control (e.g., formal vs informal)
- Summary comparison over time
- Memory embedding based on summary

---

## ✅ Ready to implement via:
- `loop_writer.py` (update YAML block)
- `ui/inbox.py` (display + trigger)
- Optional: `summary_agent.py` (stub/GPT logic)
