# Cursor Prompts for Ora Docs Integration

## Prompt 1: Archive and Organize

```
In the /runtime/docs/ directory:

1. Create an archive subdirectory
2. Move these files to archive/:
   - migration-log.md
   - system-update-protocol-checklist.md  
   - ora-data-structure-dataflow-2025-06-11.md
3. Git commit with message: "Archive process docs to focus Ora's knowledge base"

These are historical/process documents that don't need to be in Ora's daily reference.
```

## Prompt 2: Enhance Roadmap with OKRs

```
Update /runtime/docs/roadmap.md:

After the "Current Focus" section, add a new section called "Ora's Constitutional OKRs - Q1 2025" with:

### Objective 1: Establish Ora as an effective workstream creation partner
- KR1: Achieve 90% workstream creation completion rate (9 of 10 started workstreams get valid constitutions)
- KR2: Reduce average creation time from 30 minutes to 10 minutes through learned patterns
- KR3: Generate 20+ reusable patterns from workstream creation conversations

### Objective 2: Prove constitutional enforcement drives workstream success
- KR1: 100% of workstreams have vision, mission, and cadence defined
- KR2: 80% of workstreams add OKRs within 2 weeks of creation
- KR3: Track 5 workstreams for 30 days - measure constitution compliance vs. activity level

### Weekly Tracking
[ ] Week 1: _/10 workstreams, avg time: __ min, patterns: _/20
[ ] Week 2: _/10 workstreams, avg time: __ min, patterns: _/20

Keep the rest of the roadmap as is. Commit with message: "Add Constitutional OKRs to roadmap"
```

## Prompt 3: Create Workstream Constitution Guide

```
Create a new file /runtime/docs/workstream-constitution-guide.md with this content:

---
title: Workstream Constitution Guide
created: [today's date]
purpose: Help humans and Ora create strong workstream foundations
---

# Workstream Constitution Guide

## What Every Workstream Needs

### 1. Vision (Required)
A clear, measurable future state. Not "be successful" but "achieve X metric by Y date"

**Good Examples:**
- Sales: "Achieve 150% of quota with 90% team satisfaction by Q4"
- Engineering: "Ship features 50% faster with <2% defect rate"
- Customer Success: "95% retention with NPS >50"

### 2. Mission (Required)
Concrete daily activities that achieve the vision.

**Good Examples:**
- Sales: "Daily pipeline reviews, weekly coaching, systematic follow-ups"
- Engineering: "Continuous deployment, automated testing, code reviews"
- Customer Success: "Proactive check-ins, quarterly reviews, issue tracking"

### 3. Cadence (Required)
The rhythm of work - when things happen.

**Examples:**
- Daily: Standups, pipeline reviews
- Weekly: 1:1s, team syncs, metrics review
- Monthly: Retrospectives, OKR check-ins
- Quarterly: Planning, strategy review

## Red Flags to Avoid
- Vague vision without metrics
- Mission that's just a job description
- No clear cadence = drift
- Too many priorities = no priorities

## Questions Ora Should Ask
1. "How will you measure success?" (forces specific vision)
2. "What will your team do every day?" (clarifies mission)
3. "How often will you check progress?" (establishes cadence)

Commit with message: "Create workstream constitution guide"
```

## Prompt 4: Create Patterns Library

```
Create a new file /runtime/docs/patterns-library.md:

---
title: Ora's Pattern Library  
created: [today's date]
purpose: Living document of patterns that lead to workstream success
note: This document is updated by Ora as patterns emerge
---

# Ora's Pattern Library

*Ora updates this document as patterns emerge from successful workstreams*

## How Patterns Are Recorded

When Ora observes repeated success patterns across workstreams, they are documented here with:
- Context: When this pattern applies
- Pattern: What successful teams do
- Evidence: Measured impact
- Frequency: How often observed

## Active Patterns

### [Patterns will be added by Ora as they emerge]

Example format:
```
### Pattern: [Name]
- **Observed**: X times
- **Context**: [When this applies]
- **Pattern**: [What works]
- **Evidence**: [Measured results]
- **Last seen**: [Date]
```

## Pattern Categories
- Creation Patterns: What makes workstream creation successful
- Cadence Patterns: Rhythms that work for different teams  
- Evolution Patterns: How successful workstreams adapt
- Communication Patterns: How teams stay aligned

---
*This is a living document. Ora adds patterns based on workstream success data.*

Commit with message: "Create patterns library for Ora learning"
```

## Prompt 5: Update Ora's Document Access

```
In /src/ui/react-app/app/ora/lib/constants.ts (or wherever Ora's configuration lives):

Add references to the key documents Ora should use:

export const ORA_DOCUMENTS = {
  constitution: '/runtime/docs/roadmap.md',
  constitutionGuide: '/runtime/docs/workstream-constitution-guide.md',
  patternsLibrary: '/runtime/docs/patterns-library.md',
  architectureDecisions: '/runtime/docs/architecture-decisions.md',
  feedbackJournal: '/runtime/docs/feedback-journal.md'
};

export const ORA_CONTEXT_DOCS = [
  'workstream-constitution-guide.md',
  'patterns-library.md'
];

Add a comment: 
// Ora references these documents during workstream creation
// patterns-library.md is updated by Ora as patterns emerge

Commit with message: "Configure Ora's document references"
```

## Prompt 6: Clean Up and Validate

```
Final cleanup:

1. In /runtime/docs/, verify we now have:
   - roadmap.md (enhanced with OKRs)
   - architecture-decisions.md (unchanged)
   - system-design.md (unchanged)
   - feedback-journal.md (unchanged)
   - source-integrations.md (unchanged)
   - alignment-protocol.md (unchanged)
   - workstream-constitution-guide.md (new)
   - patterns-library.md (new)
   - archive/ (with 3 moved files)

2. Ensure all new files have proper frontmatter
3. Verify no broken internal links
4. Run any linting/formatting

Commit with message: "Complete Ora docs integration - focused knowledge base"

The docs are now focused, integrated, and ready for Ora to use during workstream creation.
```