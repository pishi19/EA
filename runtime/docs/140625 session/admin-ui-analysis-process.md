# How I'll Analyze and Consult on Admin UI

## Step 1: Initial Analysis Output

When I first examine the Admin UI, I'll create a document like this:

```markdown
# Admin UI Analysis

## Component Inventory
1. **Header Section**
   - Contains: [what I see]
   - Appears to: [what I think it does]
   - Questions: [what I'm unsure about]

2. **Main Layout**
   - Structure: [grid, flex, etc.]
   - Sections: [list each section]
   - Responsive: [yes/no, breakpoints]

3. **Data Display**
   - Type: [table, cards, list]
   - Fields shown: [list columns/data]
   - Interactive elements: [buttons, filters]

4. **Actions/Controls**
   - Primary actions: [what can users do]
   - Filters/controls: [how users navigate]
   - State management: [how data updates]

## Patterns I Notice
- [Design system being used]
- [Component library patterns]
- [Data flow patterns]
```

## Step 2: Consultation Points

Before making any changes, I'll ask:

```markdown
# Consultation Questions

1. **About the Table/List**
   - I see it displays [X data] with [Y columns]
   - Is this for viewing all workstreams eventually?
   - Which columns are essential vs. nice-to-have?

2. **About the Filters**
   - Current filters are [list them]
   - Are these filtering local data or will they query?
   - Should Ora's view keep these same filters?

3. **About the Actions**
   - I see buttons for [list actions]
   - Which actions should Ora keep?
   - What new actions does Ora need?

4. **About the Layout**
   - Current layout is [describe]
   - Where would conversation fit best?
   - Should we keep the same responsive behavior?
```

## Step 3: Minimal Change Proposal

I'll present options, not prescriptions:

```markdown
# Proposed Minimal Changes for Ora

## Option A: Side Panel
- Keep entire Admin layout
- Add collapsible conversation panel on right
- Workstream list updates after creation
- [Visual sketch in ASCII or description]

## Option B: Replace Action Area
- Keep header and table
- Replace bottom action area with conversation
- More integrated feel
- [Visual sketch in ASCII or description]

## Option C: Modal Approach
- Keep Admin exactly as is
- "Create Workstream" opens modal with Ora
- Least disruptive to existing design
- [Visual sketch in ASCII or description]

Which direction feels right?
```

## Step 4: Implementation Plan

Based on your feedback:

```markdown
# Implementation Plan

## What I'll Keep
- [Components you said are important]
- [Patterns that work well]
- [Design decisions to honor]

## What I'll Add
- [Minimal new components]
- [Where they'll integrate]
- [How they'll interact with existing]

## What I'll Modify
- [Small changes needed]
- [Why each change]
- [How to preserve intent]

## What I Won't Touch
- [Sacred cows]
- [Complex integrations]
- [Things for later phases]
```

## Step 5: Build with Checkpoints

As I build, I'll pause at key moments:

```markdown
# Checkpoint 1: Structure Ready
- Ora page created at /ora
- Base components in place
- No functionality yet
→ "Here's the structure. Any concerns?"

# Checkpoint 2: Conversation UI Added
- Chat interface integrated
- Respects existing patterns
- Not wired up yet
→ "Does this feel right visually?"

# Checkpoint 3: Basic Functionality
- Can have conversations
- Creates workstreams
- Updates display
→ "Try creating a workstream. What's missing?"
```

## The Key: Progressive Disclosure

I won't dump all changes at once. Instead:
1. Show what exists
2. Ask what matters
3. Propose minimal changes
4. Build incrementally
5. Check at each step

This way you can course-correct before I go too far in wrong direction.