/// <reference types="@testing-library/jest-dom" />
import { parsePlan } from '@/lib/plan-parser';

const mockMarkdownContent = `
---
title: Workstream Plan
---

### User-Defined Tasks

- [ ] This is a single-line task.
  \`added_by: user\`
  \`source: plan: workstream_plan.md\`

- [x] This is a completed task with a
multi-line description.
  \`added_by: user\`
  \`status: done\`

### Ora-Suggested Tasks

- [ ] This task has context.
  \`added_by: ora\`
  \`context: This is important.\`

- [ ] This is a promoted task.
  \`added_by: ora\`
  \`status: promoted\`
  \`promoted_to: loop-123.md\`

### User-Defined Tasks

- [ ] This task is under a second user-defined section.
  \`added_by: user\`
`;

describe('Markdown Plan Parser', () => {
    it('should parse all tasks from the markdown content', () => {
        const tasks = parsePlan(mockMarkdownContent);
        expect(tasks).toHaveLength(5);
    });

    it('should correctly parse a simple, single-line task', () => {
        const tasks = parsePlan(mockMarkdownContent);
        const task = tasks.find(t => t.description === 'This is a single-line task.');
        expect(task).toBeDefined();
        expect(task?.status).toBe('pending');
        expect(task?.section).toBe('User-Defined Tasks');
        expect(task?.added_by).toBe('user');
    });

    it('should correctly parse a completed, multi-line task', () => {
        const tasks = parsePlan(mockMarkdownContent);
        const task = tasks.find(t => t.description.startsWith('This is a completed task'));
        expect(task).toBeDefined();
        expect(task?.status).toBe('done');
        expect(task?.description).toContain('multi-line description');
    });
    
    it('should correctly parse a task with context metadata', () => {
        const tasks = parsePlan(mockMarkdownContent);
        const task = tasks.find(t => t.description === 'This task has context.');
        expect(task).toBeDefined();
        expect(task?.context).toBe('This is important.');
        expect(task?.section).toBe('Ora-Suggested Tasks');
    });

    it('should correctly parse a promoted task', () => {
        const tasks = parsePlan(mockMarkdownContent);
        const task = tasks.find(t => t.description === 'This is a promoted task.');
        expect(task).toBeDefined();
        expect(task?.status).toBe('promoted');
        expect(task?.promoted_to).toBe('loop-123.md');
    });

    it('should correctly handle multiple sections of the same type', () => {
        const tasks = parsePlan(mockMarkdownContent);
        const task = tasks.find(t => t.description.includes('second user-defined section'));
        expect(task).toBeDefined();
        expect(task?.section).toBe('User-Defined Tasks');
    });
}); 