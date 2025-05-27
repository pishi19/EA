# Ora Interaction Modes Guide

Ora is designed to serve as a dynamic interface between structured knowledge, unstructured signals, and user-directed reasoning. This guide explains the various interaction modes through which users engage with Ora — from chat-based guidance to YAML manipulation — and outlines how to use them effectively across the executive workflow.

---

## 1. Overview

Ora supports multiple interaction modes tailored to different user needs, levels of abstraction, and stages of the loop lifecycle. These include:

- Natural language chat via a UI interface
- YAML-based task and loop editing
- Prompt-driven commands in CLI or automation contexts
- Feedback-oriented updates via inline metadata
- Passive ingestion and suggestion systems

Each interface is designed to be composable and context-aware — allowing you to move fluidly between structured thinking, exploratory queries, and automation.

---

## 2. Interaction Modes

### 2.1 Ora UI Chat (Streamlit/React Interface)

**Purpose:**  
Provide real-time guidance, reasoning, triage, and summarization.

**Capabilities:**
- Summarize and reason over active loops
- Clarify ambiguous loops
- Trigger creation, merging, or promotion of loops
- Pull relevant people, signals, and goals into scope

**Use Cases:**
- “What loops have high ambiguity?”
- “Summarize all loops under ‘Mecca Store Nights’.”
- “Create a follow-up for the loop about Chadstone inventory.”

**Integration:**  
Backed by GPT prompt injection, filtered through loop metadata and Qdrant vector matching.

---

### 2.2 YAML Interface (Frontmatter + Loop Files)

**Purpose:**  
Enable precise and scriptable interaction with loop metadata.

**Editable Fields:**
- `program`, `project`, `priority`, `status`, `weight`, `ambiguity`, `tags`
- `feedback`, `related_loops`, `last_updated`

**Use Cases:**
- Manually correcting a misclassified loop
- Adding feedback for retraining
- Cross-referencing other loops

**Example:**
```yaml
---
program: Sales
project: Mecca Store Nights
status: active
weight: 0.91
ambiguity: 0.12
tags: [#signal/invite, #task/follow-up]
feedback: strong signal, ready to promote
---
```

---

### 2.3 CLI and Script Hooks

**Purpose:**  
Automate loop creation, ingestion, and classification from command-line tasks or cron jobs.

**Key Scripts:**
- `python ingest/gmail_ingest.py`
- `python process/classify_loops.py`
- `python promote/high_weight_dashboard.py`

**Use Cases:**
- Nightly task extraction
- Scheduled classification refresh
- Bulk project re-mapping

---

### 2.4 Prompt Injection + GPT Reasoning

**Purpose:**  
Shape Ora’s logic using system-wide or scoped prompts.

**Example Prompt Context:**
> “You are Ora, the executive assistant. These loops have ambiguity > 0.5. The user needs help clarifying which ones require follow-up.”

**Prompt Sources:**
- `System/Reference/*.md`
- Dynamic injection based on user history
- Domain/contact-specific overrides

---

### 2.5 Obsidian Integration

**Purpose:**  
Embed reasoning and feedback loops into your core vault workflows.

**Functions:**
- Inline chat via plugin
- Frontmatter-driven loop parsing
- Backlink and block-reference navigation
- Embedded tags trigger Ora actions

**Use Cases:**
- Review all loops linked to a goal file
- Add `#useful` to tune loop classification
- Navigate to related people or documents from a loop

---

## 3. Core Behaviors

Ora is structured around a few key behavioral patterns:

- **Reactivity:** Responds to weights, ambiguity, and tag signals
- **Memory-awareness:** Considers related loops and history
- **Composable:** One mode’s output becomes another’s input
- **Feedback-sensitive:** Learns from interaction patterns, tags, and edits

---

## 4. Example Use Cases

| Interaction | Intent | Mode |
|------------|--------|------|
| "What is the most important loop from Mecca last week?" | Signal extraction | UI Chat |
| Tagging a loop `#false_positive` | Improve classification | YAML |
| `python classify_loops.py --recent` | Re-evaluate recent loops | CLI |
| Adding `related_loops:` to YAML | Build cross-loop context | YAML |
| "Summarize this thread and link to relevant project" | Integrative reasoning | UI Chat |
| Highlight a quote in Obsidian and tag it `#signal/client` | Extract task | Obsidian |

---

## 5. Advanced Patterns

### 5.1 Loop Clarification Dialogues

When a loop has high ambiguity, Ora can ask:
> “This loop about ‘VIP invite’ is untagged. Is it related to Mecca?”

If confirmed, it:
- Adds tag `#program/mecca`
- Lowers ambiguity
- Updates vector model

---

### 5.2 YAML Patching and Trace Logging

- All YAML changes are logged in `/System/Logs/loop_changes/`
- Diff patches show before/after metadata
- Feedback on changes is tracked and retrainable

---

### 5.3 Cross-Slice Summarization

Example:
> “Summarize all loops tagged `#signal/invite` in the last 7 days across Sales and Ops.”

Ora:
- Filters and ranks loops
- Outputs grouped digest with people and projects

---

### 5.4 Follow-up Loop Generation

If a loop is marked `status: done`, Ora asks:
> “Would you like to generate a follow-up loop or archive this?”

---

### 5.5 Triaging Unstructured Tasks

From inbox or text dumps:
- Detects bullets, todos, signals
- Promotes to loops with tentative tags
- Flags ambiguous items for manual review

---

## 6. Roadmap (Planned Features)

### 6.1 Voice-to-Loop
- Ingest voice memos (from mobile)
- Transcribe, extract intent, classify into loop

### 6.2 Direct Loop Edits via Chat
- Use chat to update YAML fields:
  > “Set this loop’s priority to high and assign to Operations.”

### 6.3 Multi-modal Chat Threads
- Support image-to-loop and file annotation

### 6.4 Active Suggestion Thread
- Ora prompts you with loops needing feedback or tagging

### 6.5 Persona-aware Prompt Routing
- Use different GPT tones based on user profile or contact domain

---

This guide reflects the interaction layer as of May 2025. Each mode is part of a unified, composable system — designed to amplify structured thinking while remaining frictionless in your daily executive context.