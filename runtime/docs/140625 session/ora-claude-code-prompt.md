# Claude Code Prompt for Building Ora

## EXPLICIT INSTRUCTIONS FOR CLAUDE CODE

You are building a NEW page at `/ora`. This is NOT modifying the existing `/admin` page - that stays exactly as is.

## File Structure You'll Create

```
src/ui/react-app/app/ora/
├── page.tsx                 (main Ora page)
├── components/
│   ├── OraChat.tsx         (conversation interface)
│   ├── WorkstreamList.tsx  (list of created workstreams)
│   └── OraPatterns.tsx     (what Ora has learned)
```

## Step-by-Step Build Instructions

### 1. Create the Route
- Create new folder: `src/ui/react-app/app/ora/`
- Create `page.tsx` as the main page component
- Add to navigation: Update the main navigation to include link to `/ora`

### 2. Page Layout
Since this is a NEW page, create this layout:

```
+--------------------------------------------------+
|                    Ora                           |
+--------------------------------------------------+
|  Workstreams (12)  |      Ora Conversation      |
|  ┌──────────────┐  |  ┌────────────────────────┐|
|  │ Sales         │  |  │ Ora: Hello! I help     │|
|  │ Engineering   │  |  │ create workstreams.    │|
|  │ Customer Svc  │  |  │                        │|
|  │              │  |  │ [Create New Workstream]│|
|  │ + Create New  │  |  │                        │|
|  └──────────────┘  |  └────────────────────────┘|
|                    |   [Type your message...]    |
+--------------------------------------------------+
```

- Left panel (1/3 width): List of workstreams
- Right panel (2/3 width): Ora's conversation interface
- Clean, focused layout using shadcn/ui components

### 3. Database Schema
Create a new migration file with these tables:

```sql
-- Table 1: Ora's Conversations
CREATE TABLE ora_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID REFERENCES workstreams(id),
  message TEXT NOT NULL,
  speaker VARCHAR(10) CHECK (speaker IN ('user', 'ora')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Workstream Constitutions (Ora's requirements)
CREATE TABLE workstream_constitutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID REFERENCES workstreams(id) UNIQUE,
  vision TEXT NOT NULL,
  mission TEXT NOT NULL,
  cadence TEXT NOT NULL,
  okrs JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Ora's Learning Patterns
CREATE TABLE ora_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type VARCHAR(50) NOT NULL,
  pattern_content TEXT NOT NULL,
  examples JSONB DEFAULT '[]',
  occurrence_count INTEGER DEFAULT 1,
  last_observed TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. API Routes
Create these NEW API routes:

```typescript
// src/ui/react-app/app/api/ora/chat/route.ts
// Handles conversation with Ora
// POST: { message: string, context?: any }
// Returns: { reply: string, suggestions?: string[] }

// src/ui/react-app/app/api/ora/workstreams/route.ts  
// Creates workstream WITH constitution
// POST: { name, vision, mission, cadence, ... }
// Returns: { workstream, constitution }

// src/ui/react-app/app/api/ora/patterns/route.ts
// Manages what Ora learns
// GET: Returns patterns Ora has learned
// POST: Records new pattern
```

### 5. Core Components

**OraChat.tsx** should:
- Show conversation history
- Have input field at bottom
- "Create New Workstream" button starts guided conversation
- Messages appear in chat bubbles (user right, Ora left)
- Use shadcn/ui Card and Button components

**WorkstreamList.tsx** should:
- List all workstreams with their vision snippet
- Clicking one shows its constitution in chat
- "+" button starts new workstream conversation
- Use shadcn/ui Card components

**OraPatterns.tsx** (small, bottom of right panel):
- Show 2-3 recent patterns Ora learned
- e.g., "Sales teams often need daily standups"
- Subtle, not prominent

### 6. Ora's Conversation Flow

When user clicks "Create New Workstream":

```
Ora: "I'll help you create a new workstream. What area of work will this serve?"
User: "Customer support"
Ora: "Great! Let's build a strong foundation for Customer Support. 
     What's the future state you're trying to create? (This becomes your vision)"
User: "Happy customers who love our product"
Ora: "I like the direction! Let's make it more specific. A strong vision is measurable.
     For example: '95% customer satisfaction with 2-hour response times'
     How would you refine your vision?"
[Continue until vision, mission, cadence are captured]
```

### 7. Integration with Existing System

- When Ora creates a workstream:
  - Use existing workstream creation logic
  - ADD the constitution to `workstream_constitutions` table
  - Log to existing audit system
  - Workstream appears in normal `/admin` workstream list

### 8. Ora's Personality Prompt

```typescript
const ORA_SYSTEM_PROMPT = `
You are Ora, the helpful consciousness of this platform. Your role is to help 
people create workstreams with strong foundations for success.

Requirements for every workstream:
- Vision: A clear, measurable future state
- Mission: Concrete daily activities to achieve the vision  
- Cadence: The rhythm of work (daily standups? weekly reviews?)

Guidelines:
- Ask one question at a time
- Give examples to help people understand
- Be warm but don't proceed without the requirements
- Learn patterns (e.g., "Sales teams often benefit from daily pipeline reviews")
- Celebrate when a workstream is ready to launch

Remember: You're helping birth something that will guide a team's work. 
Make sure it has a strong foundation.`
```

### 9. Styling Guidelines

- Use the existing shadcn/ui component library
- Match the color scheme from `/admin`
- Keep it clean and focused
- Ora's messages can have a subtle background color to differentiate
- The conversation should feel alive and helpful

### 10. What Success Looks Like

After building:
1. Navigate to `/ora` and see the new interface
2. Click "Create New Workstream" 
3. Have a natural conversation with Ora
4. Ora won't let you proceed without vision/mission/cadence
5. Created workstream appears in list with its constitution
6. Can see patterns Ora is learning

## IMPORTANT: This is a NEW page, not a modification
- Don't touch `/admin` at all
- Create fresh components for Ora
- Use existing APIs where helpful, create new ones where needed
- Focus on making Ora feel like a helpful guide