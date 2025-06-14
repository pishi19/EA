# Ora Development Strategy - Claude Code + Cursor Workflow

## Tool Division

### Claude Code (Big Builds)
- Database schema creation
- API scaffolding  
- Agent conversation system
- Full page components
- Integration layers

### Cursor (Precision Work)
- Component refinements
- Bug fixes
- UI polish
- Prompt tuning
- Small iterations

---

## Starting Point: Duplicate Admin → Ora

### Step 1: Create Ora Home
```
Current: /admin (keep as-is)
New: /ora (Ora's home base)
```

1. Duplicate existing Admin UI page
2. Rename to "Ora" 
3. This becomes where Ora's consciousness lives
4. Keep visual structure, transform purpose

---

## Claude Code Prompts

### Initial Big Build Prompt

```
I'm building Ora - a platform where workstreams are born with constitutional requirements.

Starting point:
- Duplicate the existing Admin UI page to create "/ora"
- Current Admin page is at: [path to admin page]
- Keep the visual structure but transform it into Ora's home

Ora's purpose:
- Ora is the platform consciousness that helps create workstreams
- Every workstream needs a constitution (vision, mission, cadence)
- Ora enforces these requirements through conversation
- Ora learns from each creation to serve better

Build:
1. PostgreSQL schema for:
   - workstreams (with constitution fields)
   - agent_conversations (full history)
   - constitution_evolution (how they change)
   - patterns_learned (what Ora discovers)

2. API endpoints for:
   - Creating workstreams
   - Storing conversations
   - Retrieving patterns

3. Transform the duplicated Admin page into Ora's interface:
   - Add conversational UI for workstream creation
   - Show Ora's learning/patterns
   - Display existing workstreams

4. Integrate with LLM for Ora's voice:
   - Ora asks clarifying questions
   - Ora enforces constitution requirements
   - Ora suggests based on patterns

Use the existing UI patterns and components. Make Ora feel like a helpful, intelligent partner.
```

---

## Cursor Prompts (Precision Work)

### Component Refinement
```
In the Ora page, refine the conversation interface:
- Make the chat feel more natural
- Add typing indicators
- Improve message formatting
```

### Bug Fix
```
The workstream creation is allowing empty vision fields.
Ora should enforce this requirement before proceeding.
Fix the validation.
```

### Polish
```
Add smooth transitions when Ora responds.
The conversation should feel alive, not mechanical.
```

---

## Workflow

### Phase 1: Big Build with Claude Code
1. Give Claude Code the full context
2. Let it create database, API, and Ora page
3. Get working end-to-end system
4. Don't interrupt - let it complete

### Phase 2: Test and Discover
1. Try creating a workstream through Ora
2. Note what feels wrong
3. Identify patterns
4. List needed refinements

### Phase 3: Cursor Refinements
1. Fix specific issues found
2. Polish interactions
3. Tune Ora's voice
4. Iterate on conversation flow

### Phase 4: Learn and Expand
1. Create multiple workstreams
2. See patterns emerge
3. Plan next Claude Code build
4. Repeat cycle

---

## Key Principles

1. **Claude Code owns structure** - Don't micromanage the big builds
2. **Cursor owns polish** - Small, focused improvements
3. **Ora owns conversation** - Let the agent personality emerge
4. **Patterns own direction** - What we learn drives what we build

---

## Success Metrics

After first cycle:
- [ ] Ora page exists and works
- [ ] Can create workstream with constitution
- [ ] Conversation feels natural
- [ ] Data persists properly
- [ ] Patterns begin emerging

---

## Next Claude Code Builds

Based on what emerges:
- Source integration system
- Loop creation mechanism  
- Pattern recognition enhancement
- Multi-workstream dashboard

Each builds on what we learned from the previous.