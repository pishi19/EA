# Ora Systematic Build Methodology

## Core Principle: Progress Through Completed Loops, Not Calendar Days

### The Build Loop (Natural Cycles)

```
Define → Build → Validate → Reflect → Next
```

Each loop completes when the work is done, not when the calendar says so.

---

## Phase 1: Minimum Infrastructure for First Workstream

### Loop 1: Database Foundation

**Definition**
- [ ] Schema for workstreams table (vision, mission, cadence required)
- [ ] Schema for agent_conversations table
- [ ] Schema for constitution_evolution table

**Build**
- [ ] PostgreSQL container setup
- [ ] Create tables
- [ ] Basic CRUD API (3 endpoints)

**Validation**
- [ ] Can we INSERT a workstream with constitution?
- [ ] Can we SELECT and display it?
- [ ] Can we UPDATE constitution fields?

**Reflection**: What was hard? What was easy? What's missing?

---

### Loop 2: Admin Agent v0.1 (Script)

**Definition**
- [ ] Conversation flow for constitution creation
- [ ] Required fields and validation rules
- [ ] How to save conversation history

**Build**
- [ ] Create prompt templates
- [ ] Build conversation state machine
- [ ] Connect to database API

**Validation**
- [ ] Create "Test Workstream 1" through conversation
- [ ] Did it enforce requirements?
- [ ] Is conversation history saved?

**Reflection**: What questions confused users? What patterns emerged?

---

### Loop 3: First Real Workstream

**Definition**
- [ ] Define a real workstream's requirements
- [ ] Identify actual sources to connect
- [ ] Set success criteria

**Build**
- [ ] Run Admin Agent conversation
- [ ] Create the workstream
- [ ] Document the experience

**Validation**
- [ ] Does the constitution make sense?
- [ ] Can we query it from database?
- [ ] Would a human understand the purpose?

**Reflection**: First real patterns observed

---

## Progress Rhythms (When You Work)

### Daily Recap (End of Each Work Session)
Quick note in `/build-logs/`:
- What got done today?
- What did I learn?
- What's next when I return?

*5 minutes max - just capture the state*

### Weekly Retro (Your Schedule)
Deeper reflection in `/retros/`:
- What loops completed this week?
- What patterns am I seeing?
- Does the work still serve workstreams?
- Any pivots needed?

*30 minutes - real reflection*

---

## Progress Tracking

### Visible Metrics (Updated When Working)
- Workstreams created: 0
- Constitutions completed: 0
- Agent conversations: 0
- Patterns identified: 0
- Loops completed: 0

### Loop Completion Checklist
- [ ] Definition clear
- [ ] Build complete
- [ ] Validation passed
- [ ] Learning captured
- [ ] Ready for next loop

---

## Flexibility Principles

1. **Work in Sessions**: Whether 30 minutes or 3 hours, complete meaningful chunks
2. **Loop Completion > Time Spent**: Better to finish Loop 1 than half-do Loops 1-3
3. **Context Preservation**: Daily recaps ensure you can pick up where you left off
4. **Natural Cadence**: Some loops take an hour, some take a week

---

## The Roadmap Agent Check-in

Whenever a loop completes, ask:
1. **Did this serve the constitutional roadmap?**
2. **What pattern did I just learn?**
3. **What would help workstreams most next?**

---

## Risk Mitigation Without Rigid Schedule

### Drift Detection
- Each loop has clear validation criteria
- Weekly retros catch strategic drift
- Daily recaps prevent context loss

### Momentum Maintenance  
- Small loops = frequent wins
- Visible progress tracking
- Clear "next loop" always defined

---

## Templates

### Daily Recap (2 minutes)
```
Date: [When]
Session: [How long]
Completed: [What specific progress]
Learned: [Key insight]
Next: [What to tackle next session]
```

### Weekly Retro (30 minutes)
```
Week of: [Date range]
Loops Completed: [List]
Patterns Observed: [What's emerging]
Workstream Value: [How this helps]
Next Priority: [Most important loop]
```

---

## Success Without Schedule

Success is measured by:
- Loops completed, not days worked
- Patterns identified, not hours logged
- Workstreams enabled, not deadlines met

The methodology serves YOUR reality while maintaining systematic progress.