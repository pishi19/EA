# Admin UI to Database Transformation Roadmap

## Vision
Transform Ora into a living system where workstreams are born with full context, structure, and continuous feedback loops that enable true LLM partnership and workstream success.

## Core Concepts

### Workstream Constitution - Enhanced with Cadence
- Required at creation: Vision, Mission, **Cadence**
- Evolving elements: OKRs/KPIs, refined cadences
- Contains hierarchy with human-authored LLM instructions at each level
- **Cadence defines the rhythm**: how often to review, report, check-in

### Emergent Dashboard & Adaptive Cadence

**Dashboard Emerges from Usage**
- Not predefined layouts but patterns that surface from actual work
- Most promoted artefacts bubble up
- Most active loops get prominent placement
- Cadence patterns become visible through data

**Agent Inference for Cadence**

**Admin Agent**: I see you have 5 people in this workstream. Teams this size typically find weekly retros most effective. Would that work for you?

**User**: We're pretty distributed, maybe every 2 weeks?

**Admin Agent**: That makes sense for distributed teams. I'll set up:
- Bi-weekly retro loops that aggregate activity
- Weekly async updates (optional) for staying connected
- How would you like retro reminders? Email, Slack, or just updated artefacts here?

**User**: Slack reminder would be great

**Admin Agent**: ✓ Slack reminder 24 hours before each retro with:
- Key metrics since last retro
- Promoted/demoted artefact patterns  
- Suggested discussion topics based on loop activity

### Cadence Reality Mismatches

1. **Too Frequent**: Daily standups scheduled but only happening 2x/week
   - Agent notices low participation
   - Suggests: "I notice dailies are sparse. Switch to twice-weekly?"

2. **Too Sparse**: Monthly OKR reviews but rapid changes happening
   - Agent sees high artefact churn between reviews
   - Suggests: "Lots of activity between reviews. Consider bi-weekly?"

3. **Wrong Time**: Monday retros but work happens Tuesday-Thursday
   - Agent sees pattern in loop activity
   - Suggests: "Your busiest day is Thursday. Friday retro might capture more?"

4. **Abandoned Cadence**: Retros stopped happening
   - Agent gentle nudge: "No retro for 3 weeks. Everything okay?"
   - Offers: "Would you like to pause retros or try a different format?"

### Hierarchical Structure
**Workstream → Program → Project → Artefact** (task/action)
- Each level includes instructions FROM humans TO the LLM
- LLM is most active at the artefact level
- Structure provides the skeleton for organized execution

### Loops as Feedback System  
- Pull source information relevant to the hierarchy level
- Primarily attach to artefacts (task/action level)
- Can create summaries at higher levels (project/program)
- Example: Slack messages → relevant task loop → project summary loop
- Learning system: patterns will emerge through usage

### Feedback & Learning System (Already Prototyped in UI)
- **Promotion/Demotion buttons**: Each artefact can be voted up/down
  - Teaches LLM which sources provide valuable information
  - Creates efficacy scores for source-to-artefact mappings
- **Chat per artefact**: Bidirectional human-LLM communication
  - Humans provide context and corrections
  - LLM asks clarifying questions
- **Vector Database**: The intelligence layer
  - Embeds all artefacts with semantic context
  - Tracks source efficacy patterns
  - Enables intelligent routing of new information
  - Critical for platform success

## Current State
- Admin UI page with established patterns from 4 pages
- File-based storage (YAML/Markdown)  
- Manual workstream creation without source integration
- No systematic LLM context at each hierarchy level
- Static roadmaps without feedback loops

## Target State
- Database-driven platform (PostgreSQL → Supabase-ready)
- Admin UI births complete workstreams with:
  - Full hierarchical structure
  - LLM context at every level
  - Connected source feeds
  - Active feedback loops
- Living system that evolves through loop feedback
- True LLM partnership through rich context

---

## Phase 1: Admin as First Agent (Foundation)

**Objective**: Transform Admin from UI to agentic system that enforces constitution-first workstream creation

### Core Concept
Admin is not just a UI - it's Ora's first agent that:
- Enforces requirements (won't proceed without vision/mission)
- Asks clarifying questions
- Helps complete constitutions over time
- Learns from each interaction

### What Changes
- Admin becomes conversational, not just forms
- Database stores conversation history and decisions
- Agent asks questions based on workstream type
- Learning loop: each creation improves future questions

### Key Behaviors to Prototype
- **Blocking**: "I need a mission statement before we proceed"
- **Clarifying**: "Your vision mentions 'customer success' - how will you measure this?"
- **Suggesting**: "Based on your goals, would Slack #customer-feedback be useful?"
- **Learning**: "Previous Sales workstreams found these KPIs helpful..."

### Edge Case Conversations

**Edge Case 1: Vague/Resistant User**

**User**: Look, I just need a Sales workstream. Vision is "sell more stuff"

**Admin Agent**: I understand you want to move quickly. However, workstreams without clear direction tend to struggle. 

How about this: Let's set a basic vision now like "Increase revenue through systematic sales processes" and I'll remind you in a week to refine it based on what you learn?

The clearer your vision, the better I can route relevant Slack messages and emails to help you.

**User**: Fine, but I don't have time for all this

**Admin Agent**: No problem! Here's the minimum I need:
- Vision: "Increase revenue through systematic sales processes" (we can refine later)
- Mission: What's one thing your team will do daily? Even "Follow up on all leads within 24 hours" works

I'll check in next Monday to help you add:
- Specific revenue goals
- KPIs to track progress
- Which email lists to monitor

Sound good?

---

**Edge Case 2: Overly Ambitious User**

**User**: I want to track 47 KPIs and connect every possible data source

**Admin Agent**: I love the enthusiasm! However, successful workstreams typically start focused and expand. 

Let me suggest starting with:
- 2-3 core KPIs that directly reflect your vision
- 2-3 most active data sources

Here's why: With too many signals, important insights get lost. I've seen workstreams succeed by mastering a few metrics first.

Which 2-3 metrics would tell you immediately if you're achieving your vision?

---

**Edge Case 3: User Without Goals Ready**

**User**: I have vision and mission but honestly haven't figured out our OKRs yet

**Admin Agent**: That's perfectly normal! Many workstreams clarify their goals after seeing initial data.

Let's proceed with what you have. I'll:
- Set a reminder to revisit OKRs with you in 2 weeks
- Watch your source data for patterns that might suggest good metrics
- Draft some potential OKRs based on what I observe

Would you prefer weekly check-ins or just when I spot something interesting?

**User**: Weekly sounds good

**Admin Agent**: ✅ Set! Every Monday I'll:
- Share insights from your source data
- Suggest potential OKRs based on patterns
- Help you refine your constitution

Remember, you can also chat with me anytime by clicking the chat icon in your workstream header.

---

**Edge Case 4: No Relevant Sources Available**

**User**: We use Microsoft Teams but I don't see it in available sources

**Admin Agent**: You're right, Teams isn't connected yet at the platform level. Here's what I can do:

1. Create your workstream with available sources (any relevant emails?)
2. Flag Teams as a requested integration for the platform team
3. When Teams is added, I'll notify you immediately to connect it

In the meantime, would you like me to:
- Set up email filters that might capture Teams notifications?
- Create manual loops where you can paste important Teams messages?

The workstream can absolutely succeed while we work on getting Teams connected.

---

## Phase 2: LLM Co-Creation of Workstream Roadmaps

**Objective**: LLM helps create complete workstream roadmaps during setup

### What Changes
- Workstream creation wizard includes roadmap co-creation
- LLM reads Ora's System Roadmap as example/template
- LLM drafts workstream-specific phases, projects, tasks based on vision/mission
- Interactive refinement between human and LLM
- Roadmap must be complete before workstream is created

### Key Decisions  
- How much of Ora's roadmap structure is mandatory vs. guidance?
- What context does LLM need to create relevant roadmap?
- How many iterations of refinement are allowed?

### Success Criteria
- [ ] LLM can generate complete roadmap drafts
- [ ] Roadmaps align with workstream vision/mission/OKRs
- [ ] Human can refine LLM suggestions before finalizing
- [ ] No workstream exists without a complete roadmap

---

## Phase 3: Intelligent Source Mapping

**Objective**: LLM recommends relevant sources based on workstream goals

### What Changes
- Platform-level source registry (Gmail, Slack, Jira, etc.)
- LLM analyzes workstream vision/mission/OKRs
- LLM suggests which sources and filters would help achieve goals
- Admin UI presents recommendations for approval

### Key Decisions
- How does LLM determine source relevance?
- What metadata about sources does LLM need?

### Success Criteria
- [ ] Source registry exists at platform level
- [ ] LLM can map workstream goals to relevant sources
- [ ] Workstream creation includes source selection step

---

## Phase 4: Full Database Migration

**Objective**: Complete transition from files to database

### What Changes
- All workstream data moves to database
- Other UI pages read from database
- File system becomes read-only archive
- Real-time updates via database

### Key Decisions
- When to cut over from files to database?
- How to maintain backward compatibility?

### Success Criteria
- [ ] All workstreams exist in database with contracts
- [ ] All UI pages use database as source of truth
- [ ] File system archived but accessible

---

## Systems View Checkpoints

After each phase, we validate:

1. **Contract Enforcement**: Can ungoverned workstreams still be created?
2. **Source of Truth**: Is the System Roadmap template being honored?
3. **LLM Context**: Does the LLM have sufficient context from roadmap?
4. **Audit Trail**: Can we trace every workstream back to its genesis?
5. **Source Alignment**: Are sources contributing to stated goals?

---

## Next Steps

Before proceeding to Phase 1:
- Review current System Roadmap structure
- Identify which parts become database schema
- Define the workstream contract template
- Plan LLM integration points