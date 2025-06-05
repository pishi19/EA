# 🧭 Cursor Development Guidelines for Ora

## Purpose
This document outlines when and how to use Cursor as part of the Ora development process, so your work stays coherent, testable, and aligned with Ora’s system architecture.

---

## ✅ Use Cursor For

| Action                      | Why                     |
|-----------------------------|--------------------------|
| Writing and running tests   | Immediate feedback loop |
| Reviewing diffs and history | Visual and precise      |
| Working with Git branches   | Version safety and control |
| Inspecting file relationships | Tree view context |
| Refactoring local functions | Controlled, localized updates |

---

## ❌ Avoid Using Cursor For

| Action                            | Why                        |
|-----------------------------------|-----------------------------|
| Generating new modules            | Should be prompted via Ora |
| Planning new UI features          | Must tie to roadmap YAML   |
| Writing prompts or LLM chains     | Managed in prompts/        |
| Updating YAML in markdown         | Done via loop slice UI     |
| Deploy logic or config generation | Done via deploy/ in Ora    |

---

## 🧪 Best Practices

- Use `pytest` for loader + system tests
- Use `streamlit run src/interface/streamlit_app.py` to preview UI
- Use `git status`, `git log`, `git diff` to inspect prompt-generated changes
- Use `vault/`, not local markdown folders

---

## 🧠 Mental Model

Cursor is the **execution surface**. Ora is the **reasoning system**.

Ask:
> “Does this belong to the system’s design?”  
If yes → prompt Ora.  
If no → implement, test, or debug in Cursor.
