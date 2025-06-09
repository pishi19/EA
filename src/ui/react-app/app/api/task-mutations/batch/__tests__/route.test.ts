import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import matter from 'gray-matter';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('gray-matter');
jest.mock('@/lib/yaml-engine', () => ({
  matterOptions: {}
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as jest.MockedFunction<typeof matter>;

describe('/api/task-mutations/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.readdir.mockResolvedValue([]);
    mockFs.readFile.mockResolvedValue('');
    mockFs.writeFile.mockResolvedValue();
    mockFs.unlink.mockResolvedValue();
    mockMatter.mockReturnValue({
      data: {},
      content: '',
      stringify: jest.fn().mockReturnValue('')
    } as any);
  });

  describe('POST /api/task-mutations/batch', () => {
    it('should handle batch add operations', async () => {
      const operations = [
        {
          action: 'add',
          operationId: 'op1',
          taskData: {
            title: 'Task 1',
            description: 'Description 1',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: ['test']
          }
        },
        {
          action: 'add',
          operationId: 'op2',
          taskData: {
            title: 'Task 2',
            description: 'Description 2',
            status: 'in_progress' as const,
            phase: '11.3',
            workstream: 'system-integrity',
            tags: ['test', 'batch']
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].operationId).toBe('op1');
      expect(data.results[1].operationId).toBe('op2');
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should handle batch edit operations', async () => {
      const mockFileContent = `---
uuid: test-uuid-1
title: Original Title
---
Content`;

      mockFs.readdir.mockResolvedValue(['task-1.md', 'task-2.md'] as any);
      mockFs.readFile.mockResolvedValue(mockFileContent);
      mockMatter.mockReturnValue({
        data: { uuid: 'test-uuid-1' },
        content: 'Content',
        stringify: jest.fn().mockReturnValue('updated content')
      } as any);

      const operations = [
        {
          action: 'edit',
          operationId: 'edit1',
          taskId: 'test-uuid-1',
          taskData: {
            title: 'Updated Task 1',
            description: 'Updated Description',
            status: 'complete' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: ['updated']
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].operationId).toBe('edit1');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('task-1.md'),
        'updated content',
        'utf-8'
      );
    });

    it('should handle batch delete operations', async () => {
      mockFs.readdir.mockResolvedValue(['task-1.md', 'task-2.md'] as any);
      mockFs.readFile.mockResolvedValue('---\nuuid: test-uuid-1\n---\nContent');
      mockMatter.mockReturnValue({
        data: { uuid: 'test-uuid-1' },
        content: 'Content',
        stringify: jest.fn()
      } as any);

      const operations = [
        {
          action: 'delete',
          operationId: 'del1',
          taskId: 'test-uuid-1'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].operationId).toBe('del1');
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('task-1.md')
      );
    });

    it('should handle mixed batch operations', async () => {
      mockFs.readdir.mockResolvedValue(['task-existing.md'] as any);
      mockFs.readFile.mockResolvedValue('---\nuuid: existing-uuid\n---\nContent');
      mockMatter.mockReturnValue({
        data: { uuid: 'existing-uuid' },
        content: 'Content',
        stringify: jest.fn().mockReturnValue('updated content')
      } as any);

      const operations = [
        {
          action: 'add',
          operationId: 'op1',
          taskData: {
            title: 'New Task',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        },
        {
          action: 'edit',
          operationId: 'op2',
          taskId: 'existing-uuid',
          taskData: {
            title: 'Updated Task',
            status: 'complete' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: ['updated']
          }
        },
        {
          action: 'delete',
          operationId: 'op3',
          taskId: 'existing-uuid'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(3);
      expect(data.results.map(r => r.operationId)).toEqual(['op1', 'op2', 'op3']);
    });

    it('should handle partial failures gracefully', async () => {
      mockFs.readdir.mockResolvedValue([]);
      mockFs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      const operations = [
        {
          action: 'add',
          operationId: 'success',
          taskData: {
            title: 'Success Task',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        },
        {
          action: 'add',
          operationId: 'failure',
          taskData: {
            title: 'Failure Task',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(207); // Partial success
      expect(data.success).toBe(false);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].success).toBe(true);
      expect(data.results[1].success).toBe(false);
      expect(data.results[1].error).toContain('Write failed');
    });

    it('should validate operations array', async () => {
      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Operations array is required');
    });

    it('should validate operation structure', async () => {
      const operations = [
        {
          action: 'add',
          // Missing operationId
          taskData: {
            title: 'Task',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('must have action and operationId');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should handle file system errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const operations = [
        {
          action: 'add',
          operationId: 'op1',
          taskData: {
            title: 'Task',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toContain('Permission denied');
    });
  });

  describe('GET /api/task-mutations/batch', () => {
    it('should return API documentation', async () => {
      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.description).toBe('Batch task mutations API');
      expect(data.supportedActions).toEqual(['add', 'edit', 'delete']);
      expect(data.requiredFields).toBeDefined();
      expect(data.responseFormat).toBeDefined();
    });
  });

  describe('Rollback data generation', () => {
    it('should include rollback data for successful operations', async () => {
      const operations = [
        {
          action: 'add',
          operationId: 'op1',
          taskData: {
            title: 'Task 1',
            status: 'planning' as const,
            phase: '11.2',
            workstream: 'workstream-ui',
            tags: []
          }
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.rollbackData).toBeDefined();
      expect(data.rollbackData).toHaveLength(1);
      expect(data.rollbackData[0].action).toBe('add');
    });
  });
}); 