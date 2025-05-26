
### **🔄 Signal Ingestion Logic: Mecca Program Flow**

  

This document breaks down the step-by-step signal ingestion flow for the Mecca Program, mapping how inbound messages from different roles become structured system input. This includes filters, classifications, fallback handling, user intervention, and eventual loop generation.

---

### **🧭 Ingestion Scope**

  

**Goal:** Accept signals that are relevant to the Mecca Program and its roadmap-aligned projects.

  

**Accepted Sources:**

- Partner contacts (e.g., @mecca.com.au)
    
- Invitee responses (e.g., @gmail.com with RSVP label or CRM match)
    
- Internal instructions (e.g., CRM, coordination, asset delivery)
    

  

**Project Destinations:**

- 2.1: Invitee CRM Coordination
    
- 2.2: Partner Coordination
    
- 3.1: Event Execution Logistics
    

---

### **🧱 Stage 1: Signal Capture**

  

**Scripts Involved:** email_ingestion.py, crm_webhook_listener.py

  

**Trigger Methods:**

- Gmail label polling (@mecca, @invitee, @ora-task)
    
- Push via webhook (e.g., CRM form submits)
    
- Scheduled inbox polling every 60 mins
    

  

**Signal Structure Extracted:**

```
id: signal-2025-05-24-0930
from: sophie@mecca.com.au
subject: Confirmed October 12
label: @mecca
matched: false
source_type: email
body: "We’ve confirmed the date for Melbourne in-store night."
```

---

### **🔍 Stage 2: Contact Resolution**

  

Signal email address is checked against /04 People/ files.

- If found: role is extracted (e.g., partner)
    
- If not found: fallback to domain inference or unmatched tag
    
- Optionally, contact_feedback.py updates contact record from prior corrections
    

  

Resulting state:

```
contact_role: partner
associated_program: Mecca Retail Nights
```

---

### **🧠 Stage 3: Program Matching**

  

Classifier matches signal against project metadata:

- Roadmap-linked filters in loop metadata or /Programs/Mecca Retail Nights.md
    

```
signal_filters:
  - domain: mecca.com.au
  - label: @mecca
  - keywords: [confirmed, in-store, partner, RSVP]
```

- A match links the signal to roadmap item 2.2
    
- Classifier outputs a routing score (confidence threshold ~0.7+)
    

---

### **🪪 Stage 4: Loop Linkage or Creation**

  

If a matching loop exists:

- Signal is appended to loop file via linked block
    
- YAML is updated to include source: pointer
    

  

If not:

- New loop file is created in /Retrospectives/
    
- YAML auto-populated from signal + project scope
    

  

Example:

```
id: loop-2025-05-24-mecca-confirmation
title: Confirm Mecca Retail Night (Oct 12)
roadmap: 2.2
tags: [partner, crm, #useful]
weight: 0.61
contact: sophie@mecca.com.au
source: session_logs/email-2025-05-24-sophie.md
```

---

### **🛑 Stage 5: Fallback Handling**

  

If no match is found:

- Signal is written to /session_logs/unmatched/
    
- GPT and Streamlit show unmatched summary
    
- Optional: email tagged in Gmail with @ora-unmatched
    

  

User is expected to:

- Manually classify via loop creation or feedback
    
- Apply Gmail label to improve filter match
    
- Add sender to /People/ with correct role
    

---

### **🗃️ Stage 6: Feedback Integration**

  

If user provides feedback (YAML or checklist):

- process_feedback.py updates contact role or signal classifier
    
- Contact file is updated if reclassify: is present
    
- Loop is rerouted, updated, or relinked based on changes
    

---

### **✅ Result**

  

Signals are routed, structured, and incorporated based on:

- Who sent them
    
- What they said
    
- Where they belong
    

  

The Mecca program is not hardcoded — it is defined by the feedback, contact roles, project filters, and user decisions that shape it in real time. Ora doesn’t just receive signal — it learns from it.