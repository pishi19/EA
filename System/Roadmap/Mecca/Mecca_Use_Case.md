### 📎 Use Case: Mecca Program — Sales & Marketing

Ailo partners with Mecca, a high-end retail cosmetics brand in Australia, to host in-store events that showcase Ora to prospective users. These events are both experiential and strategic — connecting consultants, customers, and prospects with the Ailo platform in a high-trust, partner-led environment. Successfully running these events requires coordinated workflows across multiple stakeholder groups and platforms.

---

### 🧭 1. Program Definition

- **Name**: Mecca Retail Nights
- **Area**: Sales & Marketing
- **Roadmap Items**:
  - `2.1`: Invitee CRM Coordination
  - `2.2`: Partner Coordination
  - `3.1`: Event Execution Logistics

---

### 👥 2. Roles and Contacts

| Role     | Description                          | Contact Source                     |
|----------|--------------------------------------|------------------------------------|
| Internal | Ailo staff managing logistics, CRM   | Known contacts (e.g., jack@ailo)   |
| Partner  | Mecca staff (e.g., Sophie)           | Domain-based or contact file       |
| Prospect | Invitees, leads, RSVPs               | Gmail addresses, CRM form hooks    |

Each contact lives in `/04 People/{name}.md` with a defined role and program scope.

---

### 📬 3. Signal Entry Points

| Source         | Trigger                                      | Routing Mechanism                       |
|----------------|----------------------------------------------|-----------------------------------------|
| Email (Partner)| Sophie confirms venue, provides dates        | Domain-based filter: `@mecca.com.au`    |
| Email (Prospect)| RSVP response from `julie@gmail.com`        | Gmail label `@invitee-rsvp` or roadmap keyword match |
| Internal Task  | Ailo team requests CRM export                | Labeled `@ora-task`, triggers project update |
| CRM Webhook    | RSVP form submission                         | Form feed → signal → classified by filter logic |

---

### 🧠 4. Signal Classification

Signals generate new loops or update existing ones via classifier rules tied to:
- Contact role
- Active roadmap filters
- Program/project scope
- Prior feedback patterns

---

### 📄 5. Generated Loop Examples

#### ✅ Partner Coordination Loop
```yaml
id: loop-2025-05-24-mecca-confirmation
title: Confirmed Mecca Retail Event
roadmap: 2.2
tags: [partner, crm, #useful]
weight: 0.64
contact: sophie@mecca.com.au
source: session_logs/email-2025-05-24-sophie.md
```

```markdown
## Checklist
- [x] Confirm Oct 12 in-store slot
- [ ] Update CRM segment
- [ ] Send RSVP list to Mecca

## Notes
Confirmed with Sophie. RSVP list due by Oct 5. Invitee loop must sync.
```

#### ✅ Invitee CRM Coordination Loop
```yaml
id: loop-2025-05-25-rsvp-julie-bondi
title: RSVP received — Julie (Bondi Junction)
roadmap: 2.1
tags: [prospect, #useful]
weight: 0.45
contact: julie1991@gmail.com
source: session_logs/email-2025-05-25-rsvp-julie.md
```

```markdown
## Checklist
- [ ] Add to Bondi invitee list
- [ ] Tag in HubSpot
- [ ] Send confirmation email

## Notes
Julie RSVP’d via reply to campaign email. CRM tag not yet synced.
```

---

### 🧰 6. Feedback Example (Correction)

Markdown feedback:
```markdown
## 🔧 Signal Review
- [x] Reinforce as signal
- [ ] Reclassify as: partner
- [ ] Promote to Project: Invitee CRM Coordination
```

YAML feedback:
```yaml
signal_feedback:
  - reclassify: partner
  - promote
  - notes: "This was incorrectly treated as a prospect RSVP — Sophie is a Mecca brand lead."
```

---

### 🔁 7. User Behavior Summary

- In **Gmail**: label emails with `@invitee`, `@mecca`, or `@ora-task`
- In **Obsidian**: adjust loop metadata, correct contact roles, submit feedback
- In **Streamlit**: review loop health, freshness, routing gaps
- In **Chat**: ask questions like:
  - “What’s unresolved in the Mecca program?”
  - “Which RSVP loops are stale?”
  - “What feedback was applied this week?”

---

### 📍 Why It Matters

This use case grounds all the theory.  
It shows how signal classification, contact role mapping, roadmap scope, and memory formation come together.  
Ora is not just tracking events — it's maintaining executional awareness in a multi-party program.
