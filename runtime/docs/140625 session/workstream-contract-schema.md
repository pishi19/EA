# Workstream Contract Schema - Working Document

## Purpose
Define the canonical structure for workstream contracts in Ora. This contract becomes the genesis document from which all workstream context, LLM guidance, and governance flows.

## Contract Structure Options

### Option A: YAML Frontmatter + Markdown Sections
```yaml
---
# Identity
uuid: workstream-sales-2025
name: sales
displayName: Sales Enablement
owner: ash
created: 2025-06-13
status: active
type: workstream-contract
version: 1.0

# Governance
approvedBy: platform-admin
approvedDate: 2025-06-13
nextReview: 2025-09-13
---

# Vision
Transform how we approach customer acquisition through data-driven insights and systematic enablement.

# Mission
Enable the sales team with tools, processes, and insights that accelerate pipeline velocity and improve close rates.

# Objectives & Key Results (OKRs)

## Q3 2025
- **O1**: Accelerate pipeline velocity
  - KR1: Reduce average deal cycle from 45 to 30 days
  - KR2: Increase qualified opportunities by 40%
  
- **O2**: Improve sales effectiveness  
  - KR1: Increase close rate from 20% to 30%
  - KR2: Achieve 90% CRM compliance

# Constraints & Principles
- No customer data in public channels
- All opportunities must be tracked in CRM
- Weekly pipeline reviews are mandatory

# LLM Guidance
You are the Sales Enablement Assistant for this workstream. Your role is to:
- Help draft and refine sales collateral
- Analyze pipeline metrics and suggest improvements
- Generate weekly summaries of sales activities
- Flag at-risk deals based on patterns

Always maintain a consultative, data-driven tone. Never make commitments on behalf of the sales team.

# Source Mappings
- Gmail: label:sales-inbound
- Slack: #sales-team, #sales-wins
- Jira: project:SALES
- CRM: all opportunities
```

### Option B: Fully Structured YAML
```yaml
workstream:
  identity:
    uuid: workstream-sales-2025
    name: sales
    displayName: Sales Enablement
    type: workstream-contract
    version: 1.0
    
  governance:
    owner: ash
    created: 2025-06-13
    status: active
    approvedBy: platform-admin
    approvedDate: 2025-06-13
    nextReview: 2025-09-13
    
  contract:
    vision: |
      Transform how we approach customer acquisition through 
      data-driven insights and systematic enablement.
      
    mission: |
      Enable the sales team with tools, processes, and insights 
      that accelerate pipeline velocity and improve close rates.
      
    okrs:
      - period: Q3-2025
        objectives:
          - name: Accelerate pipeline velocity
            keyResults:
              - metric: average_deal_cycle
                current: 45
                target: 30
                unit: days
              - metric: qualified_opportunities
                current: 100
                target: 140
                unit: count
                
    constraints:
      - No customer data in public channels
      - All opportunities must be tracked in CRM
      - Weekly pipeline reviews are mandatory
      
  llmGuidance:
    role: Sales Enablement Assistant
    capabilities:
      - Draft and refine sales collateral
      - Analyze pipeline metrics
      - Generate weekly summaries
      - Flag at-risk deals
    tone: consultative, data-driven
    restrictions:
      - Never make commitments on behalf of sales team
      - Always cite data sources
      
  sourceMappings:
    - source: gmail
      filter: "label:sales-inbound"
    - source: slack  
      channels: ["sales-team", "sales-wins"]
    - source: jira
      project: SALES
```

## Key Design Decisions

### 1. **Required vs Optional Fields**
- **Required**: uuid, name, vision, mission, owner, llmGuidance
- **Optional**: okrs, constraints, sourceMappings, kpis

### 2. **Validation Rules**
- Vision: 50-500 characters
- Mission: 50-500 characters  
- At least one OKR required
- LLM guidance must include role and capabilities

### 3. **LLM Contract Review Checklist**
- [ ] Vision and mission are clear and measurable
- [ ] OKRs are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Constraints don't conflict with objectives
- [ ] LLM guidance aligns with workstream goals
- [ ] Source mappings cover necessary channels

### 4. **Contract Lifecycle**
```
Draft → LLM Review → Human Approval → Active → Periodic Review
                         ↓
                    Revision → LLM Review → Re-approval
```

## Open Questions

1. **Mutability**: Which fields can change post-creation?
2. **Inheritance**: Do child programs/projects inherit from workstream contract?
3. **Versioning**: How do we handle contract evolution?
4. **Templates**: Should we have workstream type templates (Sales, Engineering, Support)?
5. **Metrics**: How do we track contract compliance?

## Next Steps

1. Choose between Option A (Markdown-friendly) vs Option B (Structure-first)
2. Define LLM contract validation prompt
3. Create 3 example contracts for different workstream types
4. Test LLM's ability to validate and suggest improvements