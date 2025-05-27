**ID:** 1.0  
**Status:** in_progress  
**Priority:** High  
**File Target:** weight_loops.py  
**Prompt Saved:** Yes  
**Executed:** No  
**Instructions:**  
Implement a function that adjusts loop weights based on `#useful` and `#false_positive` tags. Update YAML frontmatter accordingly.

---

## 1.1 Retrospective Summarizer

**ID:** 1.1  
**Status:** planned  
**Priority:** Medium  
**File Target:** retrospectives/auto_summarizer.py  
**Prompt Saved:** No  
**Executed:** No  
**Instructions:**  
Read weekly retrospective files and generate a GPT summary. Save to `summary.md`.

---

## 1.2 GPT Feedback Dashboard

**ID:** 1.2  
**Status:** planned  
**Priority:** High  
**File Target:** ui/feedback_ui.py  
**Prompt Saved:** No  
**Executed:** No  
**Instructions:**  
Build a dashboard to collect and score GPT summary feedback. Include rating, flags, and optional comments.

---

## 1.3 Ora Chat Memory Routing

**ID:** 1.3  
**Status:** done  
**Priority:** Medium  
**File Target:** gpt_ora_chat.py  
**Prompt Saved:** Yes  
**Executed:** Yes  
**Instructions:**  
Ensure GPT messages are routed with context from loop summaries, including tags, program/project, and last feedback.

---
