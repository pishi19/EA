# Claude Code Project Management & Prompting Guide

## Initial Project Setup Prompt

Before the main build prompt, establish project context:

```
Project: Ora Platform Development
Current State: Multi-tenant workstream system with admin UI
Goal: Add Ora as the platform consciousness for workstream creation
Approach: Incremental, test each component, document decisions

Key Principles:
1. Don't break existing functionality
2. Test each component as you build
3. Document assumptions and decisions
4. Create TODO comments for future enhancements
5. Use git commits with clear messages
```

## Build Management Instructions

Add these to your main prompt:

### 1. Incremental Development
```
Build in this order and test each step:
1. Create route and basic page structure - TEST: Can navigate to /ora
2. Add database tables - TEST: Tables created successfully  
3. Create API endpoints - TEST: Each endpoint with curl or test file
4. Build UI components - TEST: Each component renders
5. Wire everything together - TEST: Full flow works
6. Add polish and error handling

Commit after each major step with descriptive message.
```

### 2. Documentation Requirements
```
As you build:
- Add README.md in the /ora folder explaining the architecture
- Document API endpoints with example requests/responses
- Add inline comments for complex logic
- Create a DECISIONS.md file noting key architectural choices
```

### 3. Error Handling & Edge Cases
```
For each component:
- What happens if the database is down?
- What if the user enters invalid data?
- How do we handle LLM API failures?
- Add try-catch blocks and user-friendly error messages
```

### 4. Testing Approach
```
Create these test files:
- ora-api.test.ts - Test all API endpoints
- ora-chat.test.tsx - Test conversation component
- ora-creation-flow.test.ts - Test full workstream creation

Even if tests are basic, the structure should be there.
```

## Project Structure Instructions

Add this to ensure clean organization:

```
Organize the code as:

/ora
  /components      (UI components)
  /api            (API routes)
  /lib            (Shared utilities)
  /hooks          (Custom React hooks)
  /types          (TypeScript types)
  README.md       (Architecture overview)
  DECISIONS.md    (Key decisions made)
  TODO.md         (Future enhancements)
```

## Progress Tracking

Ask Claude Code to create a progress log:

```
Create a BUILD_LOG.md file and update it as you work:

## Build Log

### Step 1: Route Setup [COMPLETE]
- Created /ora route
- Added navigation link
- Basic page renders

### Step 2: Database [IN PROGRESS]
- Created migration file
- Tables: ora_conversations [✓], workstream_constitutions [ ], ora_patterns [ ]

[etc...]
```

## Code Quality Guidelines

```
Code Standards:
1. Use TypeScript strictly - no 'any' types
2. Extract magic strings to constants
3. Create interfaces for all data structures
4. Use meaningful variable names
5. Keep functions small and focused
6. Add loading states for all async operations
```

## Git Commit Strategy

```
Use conventional commits:
- feat: Add Ora conversation component
- fix: Handle empty workstream name
- docs: Add API endpoint documentation
- test: Add Ora chat component tests
- refactor: Extract constitution validation logic

Commit often - at least after each major component.
```

## Future-Proofing Instructions

```
As you build, add TODO comments for future enhancements:

// TODO: Add source integration here when Phase 14 begins
// TODO: Cache patterns for better performance
// TODO: Add websocket support for real-time updates
// TODO: Implement more sophisticated pattern learning
```

## Debug Helper

```
Create a debug mode:
- Add NEXT_PUBLIC_DEBUG_ORA=true to show:
  - API request/response logs
  - Conversation state
  - Pattern detection logs
  
This helps troubleshooting without cluttering production.
```

## The Meta Prompt

Start your Claude Code session with:

```
I'm building a significant new feature for the Ora platform. I need you to:
1. Build incrementally and test each step
2. Document decisions as you make them
3. Create a clear project structure
4. Use git commits to track progress
5. Handle errors gracefully
6. Think about future extensibility

The goal is not just working code, but code that the team can understand, 
maintain, and extend. Build as if you're creating the foundation for something 
that will grow significantly.

Ready? Let's start with the Ora feature...

[INSERT MAIN BUILD PROMPT HERE]
```

## What This Gives You

1. **Visibility**: BUILD_LOG.md shows exactly what was built and what's pending
2. **Decisions**: DECISIONS.md explains why choices were made
3. **Structure**: Clean organization makes code maintainable  
4. **Quality**: Standards ensure consistent, debuggable code
5. **Future**: TODO comments show where to extend
6. **Safety**: Incremental approach with testing reduces risk

## Recovery Strategy

If something goes wrong:

```
If you hit a major issue:
1. Document it in BUILD_LOG.md with the error
2. Create a ISSUES.md file with:
   - What went wrong
   - What you tried
   - Potential solutions
3. Implement a workaround if possible
4. Mark it as TODO for human review
```