---
title: Ora System – Learning, Documentation & Onboarding
created: 2025-12-15
updated: 2025-12-15
owner: Ash
tags: [learning, onboarding, documentation, ui, ora]
status: in_progress
---

# Ora System — Learning, Documentation & Onboarding

This guide provides onboarding, usage patterns, and UI behavior documentation for the Ora system, ensuring all users can navigate, mutate, and reason within the canonical roadmap and artefact structure.

---

## 1. Roadmap & Artefact Navigation

- **Workstream = Ora:** All navigation starts from the “Ora” system roadmap.
- **Roadmap Dropdown/Tree:** Expands from workstream → program (phase) → project (group) → artefact (task/note/thought).
- **Current Focus:** The top roadmap item is always the actionable task.
- **Artefact Linking:** Every artefact is versioned, discoverable, and UI-navigable from the roadmap hierarchy.

---

## 2. Filtering & Taxonomy

- **Hierarchical Filters:** UI supports filtering by any combination of workstream, program (phase), project, and artefact type.
- **No Orphans:** Only artefacts present in the roadmap appear in UI; filtering always respects canonical taxonomy.
- **Dynamic Filter Controls:** Filtering controls update the tree/list live, with real-time counts and responsive layout.

---

## 3. Task & Mutation Controls

- **Inline Mutation:** Add, edit, delete actions are always accessible directly in filtered task views.
- **Batch Mode:** Enable “⚡ Batch Mode” to multi-select tasks for batch mutation.
- **Keyboard Shortcuts:**
    - Ctrl+N — New task
    - Ctrl+E — Edit task
    - Delete — Delete selected task(s)
    - Ctrl+A — Select all
    - Ctrl+Z — Undo last action
    - Ctrl+Y — Redo last action
- **Optimistic UI:** All changes reflect instantly, with “pending” visual state until API confirms. Errors auto-rollback and highlight affected tasks.

---

## 4. Undo/Redo & Recovery

- **Global Undo/Redo:** Full stack-based undo/redo system (Ctrl+Z / Ctrl+Y), supporting up to 50 actions.
- **Visual Feedback:** UI shows last action, pending undos, and count of available undos/redos.
- **Partial Failure Handling:** On batch failure, only affected tasks are rolled back and highlighted.

---

## 5. Contextual Chat (Ora Chat)

- **In-situ Chat:** Every artefact (task/note/thought) has a scoped chat panel, surfacing contextual conversation and decision history.
- **Expandable/Collapsible:** Chat panels can be expanded per artefact and show persistent, versioned dialogue.
- **Integrated with Memory Trace:** Chat content can be appended to the artefact’s memory trace or execution log.

---

## 6. Workstream, Program, and Artefact Creation

- **All creation is via the roadmap:** New programs/phases, projects, or artefacts must be created from within the roadmap structure.
- **UI Enforces Canonical Schema:** All artefact creation dialogs/forms enforce required frontmatter (uuid, workstream, program, project, artefact, type, tags, status).

---

## 7. Error Handling & Accessibility

- **Error Boundaries:** The UI captures and displays all mutation and rendering errors.
- **Visual Highlighting:** Invalid states, failed operations, and schema errors are shown inline with clear banners or badges.
- **Accessibility:** All controls have ARIA labels, keyboard navigation, and visual cues for low-vision users.

---

## 8. Docs & Help

- **Docs Tab:** “System Docs” UI surface displays all markdown documentation from /runtime/docs/.
- **Onboarding Flows:** Step-by-step onboarding content (like this doc) is accessible from within the app.
- **Tooltips/Help:** Contextual help available on key buttons, icons, and filter controls.

---

## 9. Test Coverage & Quality

- **Automated Tests:** UI, API, and batch mutation features are covered by 14+ test cases and 3+ test suites.
- **Test Coverage Reports:** Results and known issues are documented in TEST_COVERAGE_SUMMARY.md.

---

## 10. Productive Practices & System Principles

- **Everything on the roadmap:** No hidden features—if it matters, it’s on the roadmap and versioned.
- **Live consultation:** Roadmap is a living, just-in-time system; regular review and update are expected.
- **Artefact-first execution:** All real work flows through artefact mutation, not ad-hoc UI edits.
- **Consultative Appendix:** Future/consultative features and system safeguards are always visible in roadmap appendix.

---

# Appendix: Quick Reference Table

| Action                       | UI Location/Shortcut           | Behavior                                              |
|------------------------------|-------------------------------|-------------------------------------------------------|
| Navigate roadmap             | Roadmap dropdown/tree          | Browse and filter all artefacts by hierarchy          |
| Add/edit/delete task         | Inline/Batch UI, shortcuts     | Direct mutation; real-time updates                    |
| Batch select                 | Checkboxes, Ctrl+A             | Multi-select for batch operations                     |
| Undo/Redo                    | Ctrl+Z / Ctrl+Y                | Global undo/redo stack, full rollback                 |
| Open artefact chat           | Artefact context pane          | Scoped chat, memory trace, persistent log             |
| Docs/help                    | “System Docs” tab, tooltips    | Access all documentation and onboarding materials     |
| Error handling               | Inline banners, ARIA labels    | Clear feedback, accessible controls                   |

---

For any feedback or updates to this guide, please add suggestions as artefacts in the roadmap, or edit this file directly.

---
