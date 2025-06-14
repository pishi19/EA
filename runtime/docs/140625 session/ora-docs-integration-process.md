# Ora Docs Integration Process

## Goal
Transform `/runtime/docs/` into Ora's focused, living constitutional knowledge base

## Phase 1: Archive & Clean (Immediate)

### Step 1: Create Archive Structure
```bash
# In your project root
mkdir -p runtime/docs/archive
```

### Step 2: Archive Process Docs
Move these to archive (they're valuable but not daily-use):
- `migration-log.md` → `/archive/`
- `system-update-protocol-checklist.md` → `/archive/`
- `ora-data-structure-dataflow-2025-06-11.md` → `/archive/`

Keep accessible but out of Ora's primary focus.

### Step 3: Git Commit
```bash
git add .
git commit -m "Archive process docs to focus Ora's knowledge base"
```

## Phase 2: Enhance Core Documents

### Step 1: Update roadmap.md
Add to the top section:
```markdown
## Ora's Constitutional OKRs - Q1 2025

### Objective 1: Establish Ora as an effective workstream creation partner
- KR1: Achieve 90% workstream creation completion rate
- KR2: Reduce average creation time from 30 to 10 minutes
- KR3: Generate 20+ reusable patterns

### Objective 2: Prove constitutional enforcement drives success
- KR1: 100% of workstreams have vision, mission, cadence
- KR2: 80% of workstreams add OKRs within 2 weeks
- KR3: Track 5 workstreams for 30 days

[Link to full OKRs and tracking]
```

### Step 2: Merge system-design.md
Enhance with our database schema design:
- Add PostgreSQL schema
- Add component architecture
- Keep it concise - architecture overview, not implementation details

## Phase 3: Create New Living Documents

### Document 1: workstream-constitution-guide.md
```markdown
# Workstream Constitution Guide

## What Makes a Strong Foundation

Every workstream needs:
1. **Vision**: Clear, measurable future state
2. **Mission**: Daily activities to achieve vision
3. **Cadence**: Rhythm of work

## Examples That Work

### Sales Workstream
- Vision: "Achieve 150% of quota with 90% team satisfaction"
- Mission: "Daily pipeline reviews, weekly coaching, monthly strategy"
- Cadence: Daily standups, weekly 1:1s, monthly OKRs

### Engineering Workstream
- Vision: "Ship features 50% faster with 90% quality score"
- Mission: "Continuous deployment, automated testing, pair programming"
- Cadence: Daily PRs, sprint cycles, quarterly planning

## Common Pitfalls
- Vague vision: "Be successful" → "Achieve X metric by Y date"
- Missing cadence: Leads to drift and confusion
- No measures: Can't tell if you're succeeding
```

### Document 2: patterns-library.md
```markdown
# Ora's Pattern Library

*This document is updated by Ora as patterns emerge*

## Pattern Registry

### Pattern: Sales-Daily-Pipeline
- **Observed**: 3 times
- **Context**: Sales teams with 5+ members
- **Pattern**: Daily 15-min pipeline review increases close rate
- **Evidence**: Team A: +20%, Team B: +15%, Team C: +25%

### Pattern: Engineering-Sprint-Retro
- **Observed**: 2 times
- **Context**: Engineering teams using agile
- **Pattern**: Bi-weekly retros with action items improve velocity
- **Evidence**: 30% fewer repeated issues

*Ora adds new patterns here as they emerge*
```

## Phase 4: Integration with Ora

### Step 1: Update Ora's Context
Ensure Ora's system prompt includes:
```
You have access to constitutional documents in /runtime/docs/:
- roadmap.md: Ora's constitution and OKRs
- workstream-constitution-guide.md: Examples and patterns
- patterns-library.md: Learned patterns from successful workstreams
Reference these when helping create workstreams.
```

### Step 2: Create Document Update API
Ora needs ability to:
- Read these documents for context
- Append to patterns-library.md when patterns detected
- Track which documents were referenced in decisions

### Step 3: Add to Ora UI
In the `/ora` page:
- Quick link to constitution guide during creation
- Show relevant patterns during conversation
- Allow viewing (and editing with audit) of core docs

## Phase 5: Validation

### Success Criteria:
- [ ] Ora references constitution guide during creation
- [ ] Patterns library has first entry after 3 workstreams
- [ ] Docs are concise enough to be useful (< 500 lines each)
- [ ] Humans can find what they need quickly

## Implementation Order

1. **Today**: Archive old docs, update roadmap.md with OKRs
2. **With Cursor**: Create the two new documents
3. **Next Ora Session**: Update system prompt to reference docs
4. **After 3 Workstreams**: Check if patterns are emerging

This keeps docs focused, useful, and truly part of Ora's DNA.