# Ora Workflow Instantiation Design Doc

Ora is evolving from a memory assistant into a proactive orchestrator of executive workflows. This document outlines the architecture, logic, and interaction model for enabling Ora to instantiate, enrich, and activate new programs and projects across the organizational system.

---

## 1. Objective

Enable Ora to scaffold new workflows by asking intelligent questions, scanning existing signals (Slack, Gmail, loop memory), and building connected, structured starting points for program and project execution.

---

## 2. Core Concepts

### 2.1 Program and Project Anchors

Every interaction is rooted in a declared unit of work:

```yaml
program: Partnerships
project: Retail Expansion AU
```

This forms the seed around which signals, people, and processes are organized.

### 2.2 Contextual Bootstrapping

When a project is created, Ora triggers a guided bootstrap process:

#### Step 1: Title + Goal
- User enters name, intent, and description.
- Ora infers likely domain (e.g. product, legal, finance) from vector matching.

#### Step 2: People
- Ora asks: "Who’s involved?"
  - Manual entry or suggestions from history
  - Slack/Gmail parsing
  - Role-based inference from people titles

#### Step 3: Surface Signal
- Ora asks: “Point me to an initial Slack channel or email thread.”
  - Used to scan for similarity and suggest additional surfaces

#### Step 4: Related Threads, Loops, and Files
- Ora scans system memory for:
  - Matching or overlapping loops
  - Dormant loops with shared participants or tags
  - Slack/email threads with semantic similarity

#### Step 5: Cross-Functional Linkage
- If project title or domain includes keywords (e.g. payments), Ora checks:
  - “Shall I link to Legal or Risk?”
  - Based on prior projects and role patterns

---

## 3. System Layers

### 3.1 Instantiation Assistant

Handles structured prompting:

```yaml
questions:
  - "What is the title and intent of the project?"
  - "Who are the key participants?"
  - "Is there a Slack channel or email thread to scan?"
  - "Does this project touch risk, legal, payments?"
  - "Would you like a starter loop set?"
```

### 3.2 Context Miner

Scans system memory and signal surfaces:
- Slack: channel messages, threads, participants
- Gmail: threads, senders, tags
- Obsidian: loop memory, tags, backlinks

Renders suggestions:
```yaml
channel_suggestions:
  - #partnerships: 0.91
  - #growth-expansion: 0.76
```

### 3.3 Loop Network

Graph structure connecting:
- Loops ↔ People ↔ Tags ↔ Sources ↔ Goals

Stored in:
- `System/Graphs/loop_network.json`
- Also indexed in Qdrant for semantic retrieval

Used for:
- Role inference
- Pattern extraction
- Prior art matching

---

## 4. Outputs

Once confirmed, Ora:
- Creates folder structure under `/02 Workstreams/Projects/`
- Builds:
  - `strategy_loop.md`
  - `delivery_loop.md`
  - `reflection_loop.md`
- Populates:
  - YAML frontmatter with program/project
  - Related people links
  - Scanned signals as tagged entries

---

## 5. Strategic Value

| Feature | Outcome |
|--------|---------|
| Guided questions | Low cognitive load for instantiation |
| System scan | Zero-start friction, deep context |
| Role inference | Automatic stakeholder mapping |
| Loop graph | Memory continuity and reuse |
| Slack/Gmail integration | Real-world surface alignment |

---

## 6. Future Enhancements

- Loop compression: suggest merging historical loops
- Goal-linked loop clustering
- Real-time triage via chat or CLI
- Feedback-weighted project evolution

---

## 7. Status

Ready for prototyping. Next steps:
- Build `project_initializer.py`
- Define `slack_channel_map.yaml` and `people_index.yaml`
- Start loop graph indexing and visualization