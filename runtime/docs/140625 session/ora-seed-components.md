# Ora Seed Components - The Minimal Beginning

## What I'll Build (Component Level)

### 1. The Ora Page (`/ora`) - Built WITH Consultation
**What it is**: Starting from Admin UI, transformed through discussion
**Process**:
1. I'll analyze the existing Admin UI structure
2. Present what I see and what I think should change
3. You guide what to keep, modify, or remove
4. We iterate together

**Example consultation**:
```
Me: "I see the Admin page has a data table layout. 
     For Ora, we could keep this to show workstreams,
     but add a conversation panel. Thoughts?"

You: "Yes, but the table has filtering logic that's 
     important because..."
```

**Why this matters**: Every UI element exists for a reason. Understanding that reason prevents breaking valuable patterns.

### 2. Database Tables (3 only)
```
workstreams
- id, name, vision, mission, cadence
- created_at, created_by

conversations
- id, workstream_id, message, speaker (user/ora)
- timestamp

patterns
- id, pattern_type, description, count
- (for Ora to remember what it learns)
```
**Why minimal**: Just enough to store the core conversation outcome

### 3. API Endpoints (4 only)
- `POST /api/ora/conversation` - Send message, get Ora's response
- `POST /api/workstreams` - Create workstream with constitution
- `GET /api/workstreams` - List existing workstreams
- `POST /api/patterns` - Store what Ora learns

**Why minimal**: Just enough to have a conversation and save results

### 4. Ora's Initial Personality
**Simple prompt**: 
```
You are Ora, helping create a workstream.
Require: vision (why), mission (what), cadence (when)
Be helpful but don't proceed without these.
Ask one question at a time.
```
**Why minimal**: Learn what personality needs to be through use

---

## What I'm NOT Building Yet

- ❌ Source integrations
- ❌ Loops
- ❌ Complex UI
- ❌ Authentication
- ❌ Multi-tenant features
- ❌ Sophisticated patterns

These emerge AFTER we see how workstream creation actually works.

---

## The Feedback Loop You'll Use

### After I Build:

**Loop 1: Try Creating a Workstream**
1. Click "Create Workstream"
2. Have conversation with Ora
3. Note what feels wrong/right
4. Complete creation

**What to observe**:
- Did Ora ask the right questions?
- Was the flow natural?
- What data did you wish we captured?
- What patterns did you notice?

**Loop 2: Review What Got Stored**
1. Check database: Is the constitution complete?
2. Check conversation: Can you understand what happened?
3. Check patterns: Did Ora learn anything?

**What to observe**:
- Missing fields?
- Wrong data types?
- Need different structure?

**Loop 3: Try Another Workstream**
1. Create a different type (e.g., Sales vs Engineering)
2. See if Ora behaves differently
3. Notice emerging patterns

**What to observe**:
- Does Ora remember?
- Are patterns emerging?
- What's common vs unique?

---

## Your Feedback to Me

After each loop, tell me:
1. **What worked**: "The conversation felt natural when..."
2. **What didn't**: "Ora should have asked about..."
3. **What's missing**: "I wanted to capture X but couldn't"
4. **What patterns**: "I notice Sales workstreams need..."

---

## My Build Approach

```
1. Copy Admin → Create /ora page
2. Add simple chat interface
3. Create minimal database
4. Wire up basic API
5. Add simple Ora personality
6. Test with you
7. Learn what to build next
```

---

## Critical Decision Points for You

Before I build, confirm:

1. **Starting personality**: Helpful but firm about requirements?
2. **Required fields**: Vision, Mission, Cadence - anything else?
3. **Conversation style**: Formal? Casual? Professional?
4. **Visual style**: Keep Admin's look or something unique for Ora?

---

## The Seed Principle

This minimal build is the seed. From it grows:
- What other data we need (from what you try to create)
- How Ora should behave (from what works/doesn't)
- What features matter (from what you need to do)
- What patterns exist (from multiple creations)

Too much now = wrong tree
Just enough = right growth direction