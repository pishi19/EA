---
uuid: loop-2025-08-09-radix-testing-compat
title: Radix UI Compatibility with JSDOM – Dropdown Testing Degraded
phase: 9.0
workstream: system-integrity
status: blocked
score: 0.5
tags: [testing, radix, jsdom, compatibility, dropdown, resilience]
created: 2025-06-07
origin: followup
summary: |
  This loop isolates a known failure in Jest test coverage for Ora's React Task Executor. The Radix UI dropdown (Select component via shadcn/ui) fails under JSDOM due to unimplemented browser methods. This blocks full test coverage until a structural workaround is implemented.
---

## Purpose

To isolate and document the specific Radix UI compatibility issues with JSDOM testing environment that prevent full test coverage of Ora's Task Executor UI components.

## ✅ Objectives

- [ ] Document specific JSDOM/Radix UI incompatibilities
- [ ] Explore viable mocking strategies for missing DOM methods
- [ ] Evaluate alternative dropdown components for testing
- [ ] Propose long-term testing solution (mocks vs test runner change)
- [ ] Defer TaskExecutor filter coverage until resolution

## Context

The Radix UI dropdown used in Ora's Task Executor fails to function in Jest due to missing DOM methods like `hasPointerCapture` and `scrollIntoView`. These errors occur in JSDOM when rendering interactive components in portals or overlays.

## 🔧 Tasks

- [ ] Explore mocking `hasPointerCapture` and `scrollIntoView` via `Object.defineProperty`
- [ ] Spike Radix UI dropdown behavior in jsdom vs Playwright
- [ ] Evaluate whether to swap filter dropdown to non-Radix alternative
- [ ] Propose long-term solution: either advanced mocks or change test runner (e.g. Cypress or Playwright)
- [ ] Mark TaskExecutor filter coverage as deferred until resolved

---

## 🔁 Timeline

This loop is blocked until Phase 9. It is non-critical for user-facing behavior, but critical for full test validation and coverage metrics.

---

## 🧾 Execution Log

- 2025-06-07: Loop created to track and defer Radix dropdown testing failures under JSDOM

## 🧠 Memory Trace

```json:memory
{
  "description": "Radix UI testing compatibility issues isolated and deferred",
  "timestamp": "2025-06-07T00:00:00.000Z",
  "status": "blocked",
  "executor": "system",
  "context": "JSDOM incompatibility with Radix UI components prevents test coverage"
}
```
