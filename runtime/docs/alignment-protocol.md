
# Ora Alignment Protocol

## Purpose

To ensure ChatGPT (assistant), Cursor (execution environment), and the Ora loops/docs model remain perfectly aligned, traceable, and mutually reinforcing at every stage of system evolution.

----TEST

## Alignment Principles

### 1. Single Source of Truth

- The canonical system of record is the **Cursor file system**—specifically, files in `/runtime/docs/`, `/runtime/loops/`, and related runtime folders.
- No system change is “real” unless it is committed and surfaced in Cursor’s markdown/doc files.

### 2. File-First Practice (No Ephemeral Decisions)

- Every major ChatGPT suggestion, plan, decision, migration, or retrospective *must* yield a complete markdown file, ready to download and commit in Cursor.
- Never action a decision “in chat only.”

### 3. Manual, Disciplined Integration

- The human operator is always in the loop:  
    - Downloads files from ChatGPT  
    - Places/commits them in Cursor  
    - Ensures all files are versioned and surfaced in the UI
- No silent mutations; every change is auditable and traceable.

### 4. Cross-Linking and Traceability

- **Loops reference system docs** (via filename or UUID in frontmatter or execution logs).
- **System docs reference loops** (linking to loop filenames/UUIDs in each decision or migration entry).
- UI must render both, enabling direct navigation.

### 5. Use the Protocol Checklist

- The [system-update-protocol-checklist.md] is mandatory for every architectural, data, or roadmap mutation.
- No change is legitimate unless every relevant item on the checklist is completed and cross-referenced.

### 6. Feedback and Drift Correction

- Any divergence, confusion, or misalignment between ChatGPT, Cursor, and the system is logged in `feedback-journal.md`.
- Corrections and learnings are surfaced, not hidden.

### 7. Retrospective and Continuous Improvement

- Periodic reviews ensure the alignment protocol is being followed and remains fit for purpose.
- Suggestions for improvement are appended in the feedback journal and considered for protocol update.

### 8. (Future) Automated/Programmatic Sync

- As Ora matures, direct programmatic sync (e.g., via API or Cursor plugin) may be explored—but only if it maintains explicit, reviewable, cross-linked audit trails.
- Human-in-the-loop and in-band documentation remains non-negotiable.

---

## Practical Workflow: Alignment Steps

1. **Discussion or Planning in ChatGPT**  
    - When a decision, migration, or reflection is made, generate the canonical markdown file.

2. **Manual Integration in Cursor**  
    - Download the file and place in `/runtime/docs/` or `/runtime/loops/`.
    - Commit in version control.

3. **UI Surfacing**  
    - System docs and loops are rendered and cross-linked in the UI.
    - All decisions, migrations, and retrospectives are in-band.

4. **Audit and Review**  
    - Regularly check that all changes follow this protocol.
    - Use the checklist as both a process and an audit tool.

---

## Commitment

> “If it’s not in `/runtime/docs/` or `/runtime/loops/` and surfaced in the UI, it’s not part of Ora’s system of record.”

---

## Change Log

- [2025-06-08] Initial alignment protocol authored and adopted.

---
