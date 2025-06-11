import { GET } from '../route';
import { NextRequest } from 'next/server';

interface PlanTask {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'complete' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  phase: string;
  project: string;
  assignee?: string;
  dueDate?: string;
  created: string;
  lastModified?: string;
  tags: string[];
  dependencies?: string[];
}

// Mock fs module
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
}));

// Mock path module
jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
}));

import fs from 'fs/promises';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/plan-tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (url = 'http://localhost:3000/api/plan-tasks') => {
    return new NextRequest(url);
  };

  const mockTaskFiles = [
    'task-phase-11-ui-enhancement.md',
    'task-phase-11-api-development.md',
    'task-phase-12-admin-setup.md',
    'task-phase-12-permissions.md',
    'invalid-task.md'
  ];

  const mockTaskContents = {
    'task-phase-11-ui-enhancement.md': `---
id: task-ui-enhancement
title: User Interface Enhancement
description: Improve the user interface with modern design patterns
status: in_progress
priority: high
phase: "11"
project: "11.1"
assignee: frontend-team
dueDate: 2025-07-01
created: 2025-06-01T00:00:00Z
lastModified: 2025-06-15T10:30:00Z
tags:
  - ui
  - enhancement
  - frontend
dependencies:
  - task-design-system
  - task-component-library
---

# User Interface Enhancement

## Objective
Enhance the user interface with modern design patterns and improved usability.

## Tasks
- [ ] Design new component library
- [ ] Implement responsive layouts
- [x] Create accessibility guidelines
- [ ] Update existing components

## Progress
Started implementation of new design system. Component library is 60% complete.`,

    'task-phase-11-api-development.md': `---
id: task-api-dev
title: API Development and Integration
description: Develop new API endpoints and improve existing ones
status: planning
priority: medium
phase: "11"
project: "11.2"
assignee: backend-team
created: 2025-06-05T00:00:00Z
tags:
  - api
  - backend
  - integration
dependencies:
  - task-database-schema
---

# API Development and Integration

## Objective
Develop robust API endpoints for new features and optimize existing ones.

## Tasks
- [ ] Design API schema
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Write comprehensive tests

## Notes
Waiting for database schema finalization before proceeding.`,

    'task-phase-12-admin-setup.md': `---
id: task-admin-setup
title: Administration Panel Setup
description: Create comprehensive administration interface
status: complete
priority: urgent
phase: "12"
project: "12.1"
assignee: full-stack-team
dueDate: 2025-06-30
created: 2025-05-15T00:00:00Z
lastModified: 2025-06-30T16:45:00Z
tags:
  - admin
  - dashboard
  - management
---

# Administration Panel Setup

## Objective
Build a comprehensive administration panel for system management.

## Tasks
- [x] Design admin dashboard
- [x] Implement user management
- [x] Add system configuration
- [x] Create audit logging

## Completion Notes
All tasks completed successfully. Admin panel is now live and fully functional.`,

    'task-phase-12-permissions.md': `---
id: task-permissions
title: Permission System Implementation
description: Implement role-based access control system
status: blocked
priority: high
phase: "12"
project: "12.1"
assignee: security-team
created: 2025-06-10T00:00:00Z
tags:
  - security
  - permissions
  - rbac
dependencies:
  - task-admin-setup
  - task-user-management
---

# Permission System Implementation

## Objective
Implement comprehensive role-based access control system.

## Tasks
- [x] Define permission model
- [ ] Implement role assignments
- [ ] Add permission checks
- [ ] Test security scenarios

## Blockers
Waiting for admin setup completion and user management integration.`,

    'invalid-task.md': `# Invalid Task
This file doesn't have proper frontmatter and should be filtered out.`
  };

  describe('successful responses', () => {
    beforeEach(() => {
      mockFs.readdir.mockResolvedValue(mockTaskFiles as any);
      
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        const fileName = filePath.split('/').pop();
        const content = mockTaskContents[fileName as keyof typeof mockTaskContents];
        return content || '';
      });

      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date('2025-06-01T00:00:00Z')
      } as any);
    });

    it('should return all valid planning tasks', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(4); // Should exclude invalid task

      // Check specific task data
      const uiTask = data.find((task: PlanTask) => task.id === 'task-ui-enhancement');
      expect(uiTask).toMatchObject({
        id: 'task-ui-enhancement',
        title: 'User Interface Enhancement',
        description: 'Improve the user interface with modern design patterns',
        status: 'in_progress',
        priority: 'high',
        phase: '11',
        project: '11.1',
        assignee: 'frontend-team',
        tags: ['ui', 'enhancement', 'frontend']
      });
    });

    it('should include all required task fields', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      data.forEach((task: PlanTask) => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('phase');
        expect(task).toHaveProperty('project');
        expect(task).toHaveProperty('created');
        expect(task).toHaveProperty('tags');
        
        expect(Array.isArray(task.tags)).toBe(true);
        expect(['planning', 'in_progress', 'complete', 'blocked']).toContain(task.status);
        expect(['low', 'medium', 'high', 'urgent']).toContain(task.priority);
      });
    });

    it('should sort tasks by priority and status', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Check that urgent/high priority tasks come first
      const priorities = data.map((task: PlanTask) => task.priority);
      const urgentIndex = priorities.indexOf('urgent');
      const lowIndex = priorities.indexOf('low');
      
      if (urgentIndex !== -1 && lowIndex !== -1) {
        expect(urgentIndex).toBeLessThan(lowIndex);
      }
    });

    it('should include dependencies when present', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      const taskWithDependencies = data.find((task: PlanTask) => task.dependencies && task.dependencies.length > 0);
      expect(taskWithDependencies).toBeTruthy();
      expect(Array.isArray(taskWithDependencies.dependencies)).toBe(true);
    });

    it('should handle tasks with different statuses', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      const statuses = data.map((task: PlanTask) => task.status);
      expect(statuses).toContain('planning');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('complete');
      expect(statuses).toContain('blocked');
    });

    it('should handle tasks across different phases', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      const phases = [...new Set(data.map((task: PlanTask) => task.phase))];
      expect(phases).toContain('11');
      expect(phases).toContain('12');
      expect(phases.length).toBeGreaterThan(1);
    });
  });

  describe('error handling', () => {
    it('should handle directory read errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to load tasks');
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.readdir.mockResolvedValue(['task-test.md'] as any);
      mockFs.readFile.mockRejectedValue(new Error('File read error'));
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      // Should still return success but exclude problematic files
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter out tasks with missing required fields', async () => {
      const incompleteTask = `---
id: incomplete-task
title: Incomplete Task
# Missing status, priority, phase, etc.
---

# Incomplete Task`;

      mockFs.readdir.mockResolvedValue(['incomplete.md'] as any);
      mockFs.readFile.mockResolvedValue(incompleteTask);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Should exclude tasks with missing required fields
      const incompleteTaskData = data.find((task: PlanTask) => task.id === 'incomplete-task');
      expect(incompleteTaskData).toBeUndefined();
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('EACCES: permission denied');
      (permissionError as any).code = 'EACCES';
      mockFs.readdir.mockRejectedValue(permissionError);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('data validation', () => {
    it('should validate task status values', async () => {
      mockFs.readdir.mockResolvedValue(['valid-task.md'] as any);
      mockFs.readFile.mockResolvedValue(mockTaskContents['task-phase-11-ui-enhancement.md']);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      data.forEach((task: PlanTask) => {
        expect(['planning', 'in_progress', 'complete', 'blocked']).toContain(task.status);
      });
    });

    it('should validate priority values', async () => {
      mockFs.readdir.mockResolvedValue(['valid-task.md'] as any);
      mockFs.readFile.mockResolvedValue(mockTaskContents['task-phase-11-ui-enhancement.md']);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      data.forEach((task: PlanTask) => {
        expect(['low', 'medium', 'high', 'urgent']).toContain(task.priority);
      });
    });

    it('should handle tasks with malformed dates', async () => {
      const taskWithBadDate = `---
id: bad-date-task
title: Task with Bad Date
description: Test task
status: planning
priority: medium
phase: "11"
project: "11.1"
created: not-a-date
dueDate: also-not-a-date
tags: ['test']
---

# Task with Bad Date`;

      mockFs.readdir.mockResolvedValue(['bad-date.md'] as any);
      mockFs.readFile.mockResolvedValue(taskWithBadDate);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Should still include the task but handle date gracefully
      const badDateTask = data.find((task: PlanTask) => task.id === 'bad-date-task');
      expect(badDateTask).toBeTruthy();
    });
  });

  describe('response format', () => {
    beforeEach(() => {
      mockFs.readdir.mockResolvedValue(['task-test.md'] as any);
      mockFs.readFile.mockResolvedValue(mockTaskContents['task-phase-11-ui-enhancement.md']);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);
    });

    it('should set correct content-type header', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include cache control headers', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty task directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle tasks with very long descriptions', async () => {
      const longDescription = 'This is a very long description. '.repeat(1000);
      const taskWithLongDesc = `---
id: long-desc-task
title: Task with Long Description
description: ${longDescription}
status: planning
priority: medium
phase: "11"
project: "11.1"
created: 2025-06-01T00:00:00Z
tags: ['test']
---

# Long Description Task`;

      mockFs.readdir.mockResolvedValue(['long-desc.md'] as any);
      mockFs.readFile.mockResolvedValue(taskWithLongDesc);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      const longTask = data.find((task: PlanTask) => task.id === 'long-desc-task');
      expect(longTask).toBeTruthy();
      expect(longTask.description.length).toBeGreaterThan(1000);
    });

    it('should handle concurrent requests efficiently', async () => {
      mockFs.readdir.mockResolvedValue(['task-test.md'] as any);
      mockFs.readFile.mockImplementation(async () => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockTaskContents['task-phase-11-ui-enhancement.md'];
      });
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const requests = [
        createMockRequest(),
        createMockRequest(),
        createMockRequest()
      ];

      const responses = await Promise.all(
        requests.map(req => GET(req))
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
}); 