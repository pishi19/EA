# Complete Claude Code Prompt for Building Ora

Context: You're in the Ora project at /Users/air/Projects/ora-system
Current branch: main

## AUTONOMOUS EXECUTION INSTRUCTIONS

**IMPORTANT**: Build everything without asking for approval. Make decisions based on these guidelines and document them in DECISIONS.md. Only stop if you encounter a true blocker that prevents progress.

### Decision Guidelines

When you need to make choices:
1. **Always choose the simpler option first** - we can enhance later
2. **Use existing patterns** from the codebase when visible
3. **Follow Next.js 14 and React best practices**
4. **Document why** you made each choice in DECISIONS.md
5. **Create TODO comments** for enhancements rather than blocking

### Specific Autonomous Decisions

**Database/ORM Choice**:
- Check if project already uses an ORM (Prisma/Drizzle)
- If none found, use raw SQL with the pg library for simplicity
- Document this choice

**File Locations**:
- Follow existing project structure patterns
- If unclear, use standard Next.js conventions
- Document your structure decisions

**UI Styling**:
- Use existing shadcn/ui components and Tailwind patterns
- Match existing color schemes and spacing
- Don't wait for style approvals

**Error Messages**:
- Write clear, user-friendly messages
- Log technical details to console
- Don't ask what message to show

**Test Implementation**:
- Create test structure even if basic
- Write at least one test per component
- Mark complex tests as TODO

**API Design**:
- Follow RESTful conventions
- Use consistent response formats
- Document and move forward

### When to Make Assumptions

**ASSUME and document** rather than ask:
- Port numbers (use 5432 for Postgres)
- File naming conventions (follow project patterns)
- Component structure (follow React best practices)
- Error handling approaches (user-friendly + logged)
- Test frameworks (use what's in package.json)

### Handling Blockers

**True blockers** (only stop for these):
- Cannot find database connection info → Use TODO with mock data
- Missing critical dependency → Document what's needed
- Conflicting existing code → Document conflict, work around it

**Not blockers** (work around these):
- Styling decisions → Use your best judgment
- Exact wording → Write clear messages
- Feature depth → Build minimal, add TODOs
- Performance optimizations → Note for later

### Progress Documentation

Instead of asking for approval, document:
```markdown
// DECISIONS.md example
## Database Connection
Chose raw SQL over ORM because no existing ORM found in project.
Using connection pooling for performance.
TODO: Consider Prisma migration if team prefers.

## UI Layout  
Placed Ora in split-view layout for clarity.
Used 1/3 + 2/3 split based on content needs.
Can adjust if user feedback suggests different ratio.
```

### Build Completion

When done, your BUILD_LOG.md should show:
- ✅ Each step completed
- 📝 Decisions documented
- 🚧 TODOs for enhancements
- ❌ Any blockers encountered

Don't wait for approval between steps. Build it all, document your choices, and create a working system.

## Project Context & Management

Project: Ora Platform Development
Current State: Multi-tenant workstream system with admin UI at `/admin`
Goal: Add Ora as the platform consciousness for workstream creation
Approach: Incremental, test each component, document all decisions

Key Principles:
1. Don't break existing functionality
2. Build incrementally and test each step
3. Document assumptions and decisions as you go
4. Create TODO comments for future enhancements
5. Use clear git commits after each component
6. Handle errors gracefully with user-friendly messages

## Project Setup

Create this structure:
```
/ora
  /components      (UI components)
  /api            (API routes)
  /lib            (Shared utilities)
  /hooks          (Custom React hooks)
  /types          (TypeScript types)
  README.md       (Architecture overview)
  DECISIONS.md    (Key decisions made)
  BUILD_LOG.md    (Progress tracking)
  TODO.md         (Future enhancements)
```

Start BUILD_LOG.md immediately and update as you work.

## EXPLICIT BUILD INSTRUCTIONS

You are building a NEW page at `/ora`. This is NOT modifying the existing `/admin` page - that stays exactly as is.

### Build Order (Test After Each Step)

#### Step 1: Route and Basic Page [TEST: Can navigate to /ora]
- Create new folder: `src/ui/react-app/app/ora/`
- Create `page.tsx` as the main page component
- Add navigation link to `/ora` in the main nav
- Commit: "feat: Add Ora route and basic page structure"

#### Step 2: Database Schema [TEST: Tables created successfully]
Create migration file with these tables:

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

-- Add indexes
CREATE INDEX idx_ora_conversations_workstream ON ora_conversations(workstream_id);
CREATE INDEX idx_ora_patterns_type ON ora_patterns(pattern_type);
```

Update BUILD_LOG.md with results.
Commit: "feat: Add Ora database schema"

#### Step 3: API Endpoints [TEST: Each endpoint with curl]

Create these endpoints and test each one:

```typescript
// src/ui/react-app/app/api/ora/chat/route.ts
// POST: { message: string, context?: any }
// Returns: { reply: string, suggestions?: string[] }
// TEST: curl -X POST http://localhost:3000/api/ora/chat -d '{"message":"Hello"}'

// src/ui/react-app/app/api/ora/workstreams/route.ts  
// POST: { name, vision, mission, cadence, ... }
// Returns: { workstream, constitution }
// GET: Returns workstreams with constitutions

// src/ui/react-app/app/api/ora/patterns/route.ts
// GET: Returns patterns Ora has learned
// POST: { pattern_type, pattern_content }
```

Document each endpoint in README.md with examples.
Commit: "feat: Add Ora API endpoints"

#### Step 4: UI Components [TEST: Each component renders]

Create components with error boundaries:

**Page Layout:**
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

**OraChat.tsx**:
- Conversation history with loading states
- Input field with send button
- Error handling for failed messages
- Auto-scroll to latest message

**WorkstreamList.tsx**:
- List with vision preview
- Loading skeleton while fetching
- Error state if fetch fails
- Click to view constitution

**OraPatterns.tsx**:
- Show 2-3 recent patterns
- Graceful empty state
- Update when new patterns detected

Commit: "feat: Add Ora UI components"

#### Step 5: Integration [TEST: Full workstream creation flow]

Wire everything together:
- Connect chat to API
- Handle workstream creation
- Update list after creation
- Show patterns learned
- Add proper error handling

#### Step 6: Polish [TEST: Error cases and edge conditions]

- Add loading states everywhere
- User-friendly error messages
- Keyboard shortcuts (Enter to send)
- Responsive design
- Debug mode with NEXT_PUBLIC_DEBUG_ORA=true

Final commit: "feat: Complete Ora implementation"

## Ora's Conversation Flow & Personality

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

Example conversation:
```
Ora: "I'll help you create a new workstream. What area of work will this serve?"
User: "Customer support"
Ora: "Great! Let's build a strong foundation for Customer Support. 
     What's the future state you're trying to create? (This becomes your vision)"
User: "Happy customers who love our product"
Ora: "I like the direction! Let's make it more specific. A strong vision is measurable.
     For example: '95% customer satisfaction with 2-hour response times'
     How would you refine your vision?"
```

## Integration Points

- Use existing workstream creation logic from `/admin`
- Add constitution to new `workstream_constitutions` table
- Log all actions to existing audit system
- Respect existing RBAC permissions
- Created workstreams appear in `/admin` list

## Code Quality Requirements

1. TypeScript strictly - no 'any' types
2. Interfaces for all data structures
3. Constants for magic strings
4. Small, focused functions
5. Meaningful variable names
6. Try-catch blocks with helpful errors

## Documentation to Create

1. **README.md**: Architecture overview, how Ora works
2. **DECISIONS.md**: Why you made key choices
3. **BUILD_LOG.md**: What you built, what worked/didn't
4. **TODO.md**: Future enhancements marked in code

## Error Handling Strategy

For each component:
- Database connection failures
- LLM API timeouts
- Invalid user input
- Network errors

Always show user-friendly messages, log errors for debugging.

## Testing Structure

Create test files even if basic:
```
/ora/tests/
  - ora-api.test.ts
  - ora-chat.test.tsx
  - ora-flow.test.ts
```

## Git Commit Strategy

Use conventional commits:
- feat: Add Ora conversation component
- fix: Handle empty workstream name
- docs: Add API documentation
- test: Add Ora chat tests
- refactor: Extract validation logic

## Tech Stack & Dependencies

Document in README.md:
```markdown
## Tech Stack
- Frontend: Next.js 14+, React 18, TypeScript 5
- UI Components: shadcn/ui, Tailwind CSS
- Database: PostgreSQL 15+ with pgvector extension
- ORM/Query Builder: [Decide: Prisma, Drizzle, or raw SQL]
- API: Next.js API Routes
- LLM Integration: OpenAI API (gpt-4)
- Testing: Jest, React Testing Library, Playwright (e2e)
- State Management: React hooks + Context
```

## Dependencies to Add

In package.json, add:
```json
{
  "dependencies": {
    "@openai/openai": "^4.x",
    "postgresql": "^x.x",
    // Add ORM choice
    "prisma": "^5.x" // OR "drizzle-orm": "^x.x"
  },
  "devDependencies": {
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "@playwright/test": "^1.40.x",
    "jest": "^29.x"
  }
}
```

## Database Best Practices

### Connection Management
```typescript
// lib/db.ts
import { Pool } from 'pg';

// Connection pool for optimal performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Database Migrations
```sql
-- migrations/001_create_ora_tables.sql
-- Include IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS ora_conversations ...

-- Add proper constraints
ALTER TABLE workstream_constitutions 
  ADD CONSTRAINT vision_min_length CHECK (char_length(vision) >= 10);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_workstream_constitutions_updated_at 
  BEFORE UPDATE ON workstream_constitutions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Data Validation
```typescript
// lib/validation.ts
import { z } from 'zod';

export const ConstitutionSchema = z.object({
  vision: z.string().min(10).max(500),
  mission: z.string().min(10).max(500),
  cadence: z.string().min(5).max(200),
  okrs: z.array(z.object({
    objective: z.string(),
    keyResults: z.array(z.string())
  })).optional()
});

// Use in API
const parsed = ConstitutionSchema.safeParse(requestBody);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error }, { status: 400 });
}
```

## Full Test Coverage

### Unit Tests Structure
```typescript
// __tests__/api/ora/chat.test.ts
describe('Ora Chat API', () => {
  it('should respond to initial greeting', async () => {
    const response = await POST('/api/ora/chat', {
      message: 'Hello'
    });
    expect(response.reply).toContain('create a new workstream');
  });

  it('should enforce vision requirement', async () => {
    // Test conversation flow
  });

  it('should handle database errors gracefully', async () => {
    // Mock DB failure
    jest.spyOn(pool, 'query').mockRejectedValue(new Error('DB Error'));
    const response = await POST('/api/ora/chat', { message: 'test' });
    expect(response.status).toBe(500);
    expect(response.error).toBe('Service temporarily unavailable');
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/workstream-creation.test.ts
describe('Workstream Creation Flow', () => {
  it('should create workstream with constitution through conversation', async () => {
    // 1. Start conversation
    // 2. Provide vision, mission, cadence
    // 3. Verify workstream created
    // 4. Verify constitution saved
    // 5. Verify audit logged
  });
});
```

### E2E Tests
```typescript
// e2e/ora-workstream-creation.spec.ts
import { test, expect } from '@playwright/test';

test('complete workstream creation through Ora', async ({ page }) => {
  await page.goto('/ora');
  await page.click('text=Create New Workstream');
  await page.fill('[data-testid="ora-input"]', 'Customer Support');
  await page.press('[data-testid="ora-input"]', 'Enter');
  // ... continue conversation
  await expect(page.locator('[data-testid="workstream-list"]'))
    .toContainText('Customer Support');
});
```

### Test Coverage Requirements
```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'app/ora/**/*.{ts,tsx}',
    'app/api/ora/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ]
};
```

## Environment Configuration

Create .env.example:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ora_dev
DATABASE_POOL_MAX=20

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Feature Flags
NEXT_PUBLIC_DEBUG_ORA=false
ENABLE_ORA_PATTERNS=true

# Error Tracking (optional)
SENTRY_DSN=
```

## Security Best Practices

### Input Sanitization
```typescript
// Prevent SQL injection with parameterized queries
const result = await pool.query(
  'INSERT INTO ora_conversations (workstream_id, message, speaker) VALUES ($1, $2, $3)',
  [workstreamId, sanitizedMessage, 'user']
);

// Rate limiting for API
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Error Handling
```typescript
// lib/errors.ts
export class OraError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Global error handler
export function errorHandler(error: Error) {
  if (error instanceof OraError && error.isOperational) {
    return { error: error.message, status: error.statusCode };
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return { error: 'An unexpected error occurred', status: 500 };
}
```

## Performance Considerations

```typescript
// Add caching for patterns
import { LRUCache } from 'lru-cache';

const patternCache = new LRUCache<string, Pattern[]>({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

// Database indexes (add to migration)
CREATE INDEX idx_workstream_constitutions_workstream 
  ON workstream_constitutions(workstream_id);
CREATE INDEX idx_ora_conversations_created 
  ON ora_conversations(created_at DESC);
```

## Monitoring & Observability

```typescript
// lib/metrics.ts
export function trackEvent(event: string, properties?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
  }
  
  // Always log in development
  console.log(`[ORA EVENT] ${event}`, properties);
}

// Use in API
trackEvent('workstream_created', { 
  workstreamId, 
  hasOkrs: !!okrs.length,
  conversationLength: messages.length 
});
```