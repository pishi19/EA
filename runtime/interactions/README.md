# Ora Interaction Logging System

This directory contains structured logs of all meaningful interactions between users and the Ora system.

## Purpose

Track every significant exchange, decision, and action within the Ora ecosystem to maintain:
- **Complete audit trail** of user-system interactions
- **Context-aware logging** tied to specific loops, phases, and tasks
- **Semantic traceability** across all system components
- **Decision history** for reasoning and learning

## File Naming Convention

```
interaction-YYYY-MM-DD-HHMM-<contextUUID>.md
```

Examples:
- `interaction-2025-06-07-1445-loop-2025-09-16-contextual-chat-architecture.md`
- `interaction-2025-06-07-1520-task-abc123.md`
- `interaction-2025-06-07-1600-phase-10-1.md`

## File Structure

```yaml
---
uuid: <unique interaction uuid>
timestamp: <iso8601>
actor: <user|ora>
source: <loop|gmail|slack|ui|api|etc>
context: <loop-uuid|phase|task-uuid>
tags: [interaction, <phase>, <workstream>, ...]
---

## 💬 Message

<The actual message, action, or interaction content>

## 🔄 Outcome

<Result, status change, next step, or system response>
```

## Actor Types

- **user**: Human user interactions
- **ora**: System-generated responses, automated actions

## Source Types

- **loop**: Interaction within a specific loop context
- **ui**: Web interface interactions
- **api**: Programmatic API calls
- **gmail**: Email-based interactions
- **slack**: Slack-based interactions
- **chat**: Direct chat interface
- **system**: Internal system events

## Usage

Each meaningful interaction should be logged immediately to maintain real-time traceability. This creates a complete interaction graph that can be used for:

1. **Debugging** user experience issues
2. **Understanding** decision pathways
3. **Learning** from user patterns
4. **Auditing** system behavior
5. **Reconstructing** context for any given moment

## Integration

This logging system integrates with:
- ChatPane components for UI interactions
- API routes for programmatic interactions  
- Loop execution for contextual interactions
- Phase transitions for workflow interactions 