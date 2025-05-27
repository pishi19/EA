# Ora Gmail Integration User Guide

Ora connects to your Gmail account to ingest, classify, and convert email-based information into actionable loops, tasks, and signals. This guide explains how to set up Gmail integration, what data Ora uses, and how to work with the results in your daily workflow.

---

## 1. Overview

Ora ingests Gmail messages to:
- Detect and extract structured tasks and signals
- Classify messages into Programs and Projects
- Assign weights and ambiguity scores
- Promote critical loops to your dashboard
- Auto-tag and route follow-ups or key contacts

This process helps reduce noise, highlight important actions, and keep your work aligned with strategic priorities.

---

## 2. Setup

### 2.1 Prerequisites

- A Gmail or Google Workspace account
- Ora installed and running locally with access to your vault and loop memory
- Python environment configured with required OAuth scopes (`gmail.readonly`, `gmail.modify`)

### 2.2 Authentication

1. Launch Ora and run:
   ```bash
   python ingest/gmail_connect.py
   ```
2. Follow the browser-based OAuth prompt to log into your Gmail account.
3. Ora will store a token in your local secure store (`/System/secrets/gmail_token.json`).

### 2.3 Initial Sync

To run the initial Gmail ingestion:
```bash
python ingest/gmail_ingest.py --since 7d
```

This will:
- Fetch all messages from the last 7 days
- Parse threads
- Run classification
- Output raw and processed metadata to:
  - `/System/Logs/email_ingest_log.json`
  - `/0001 HQ/Inbox/incoming_emails.md`
  - Matching loops in `/02 Workstreams/Projects/` or `Programs/`

---

## 3. Workflow and Behavior

### 3.1 Loop Detection

Ora looks for:
- Explicit tasks (`@action`, checkboxes, bullets, verbs)
- Signals (keywords: “approval”, “request”, “next steps”, “can you”)
- Metadata (project codes, names, contacts)

It then:
- Creates or updates `.md` loop files
- Sets `status: new`, `source: gmail`, and applies tags (`signal/`, `task/`, `person/`)

### 3.2 Program & Project Classification

Using Qdrant similarity search, Ora:
- Compares message content with known loop vectors
- Maps to the closest Program and Project
- Falls back to `Unclassified/` with high ambiguity if no match

### 3.3 Weights and Flags

Each loop receives:
- `weight:` numeric value (importance/information density)
- `ambiguity:` score (how clear the context is)
- Optional: `feedback:` from previous cycles

These weights influence:
- Dashboard promotion
- Daily and weekly summaries
- Feedback loops

---

## 4. Interface and Review

You’ll see results in:
- `0001 HQ/Inbox/`: Summary of new Gmail-derived loops
- `02 Workstreams/Projects/`: Updated or created loop files
- Dashboard: Top-weighted loops flagged for attention

Use tags like `#useful`, `#false_positive`, or manually edit frontmatter to refine future classifications.

---

## 5. Example

Here’s a sample loop file from Gmail:

```markdown
---
loop_id: loop-2025-05-27-gmail-invite-mecca
program: Sales
project: Mecca Store Nights
source: gmail
status: new
weight: 0.91
ambiguity: 0.12
feedback: pending
tags: [#signal/invite, #person/jane-smith, #task/follow-up]
---

**Subject:** Invitation to Mecca VIP Night  
**From:** jane.smith@mecca.com.au  
**Received:** 2025-05-26 18:04

We'd love to have you and the team attend our next VIP night at the Chadstone store on Friday. Can you confirm attendance?

**Next Step:**  
- [ ] Confirm attendance with Jane  
```

---

## 6. Maintenance

### 6.1 Regular Sync

To run ingestion daily:
```bash
launchd job: gmail_sync_daily.plist
```

Or manually:
```bash
python ingest/gmail_ingest.py --since 1d
```

### 6.2 Feedback

- Tag useful loops with `#useful`
- Flag false positives with `#false_positive`
- Ora retrains its weighting and similarity logic every 24h

---

## 7. Troubleshooting

| Issue | Cause | Solution |
|------|-------|----------|
| No emails detected | Incorrect OAuth scopes or empty inbox | Re-run setup and check filters |
| Wrong classification | Low vector similarity | Add manual `project:` or `program:` frontmatter |
| Loops missing | Ingestion error or invalid YAML | Check `/System/Logs/email_ingest_log.json` |

---

## 8. Customization

You can fine-tune classification by:
- Editing loop prompt templates in `/System/Reference/email_prompt.md`
- Adding example loops to increase Qdrant vector accuracy
- Defining priority contacts in `04 Resources/04 People/`

---

## 9. Security

- OAuth token stored locally, not shared
- Gmail access is read-only unless `--archive` or `--label` is explicitly set
- All content is processed and stored within your local environment

---

## 10. Roadmap (Planned Features)

### 10.1 Gmail Label → Loop Tag Mapping
### 10.2 Gmail Tagging Override via Frontend Plugin
### 10.3 Attachment Ingestion → Obsidian Vault Integration
### 10.4 Sent Mail Classification
### 10.5 Smart Contact Extraction
### 10.6 Thread-Level Contextual Analysis
### 10.7 Confidence Scoring + Routing Suggestions
### 10.8 Contact + Domain Prompt Injection
### 10.9 Loop Feedback → Active Learning
### 10.10 Priority Queue for VIP Contacts
### 10.11 Summarized Digest from Email Loops
### 10.12 Dynamic Loop Linking Across Threads
### 10.13 "Command Email" Parsing (Task Injection via Email)
### 10.14 Email-Based Loop Feedback Capture
### 10.15 NLP-Based Mood and Tone Scoring
### 10.16 Smart Archive Suggestions
### 10.17 Contact Cadence Monitoring
### 10.18 Loop Linking to Calendar Invitations
### 10.19 Historical Backfill & Reclassification Engine
### 10.20 Relevance Decay & Loop Fading