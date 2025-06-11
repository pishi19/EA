/**
 * Multi-Workstream API Integration Tests
 * 
 * Tests all API endpoints for proper workstream isolation and data handling
 */

import { NextRequest } from 'next/server';

// Mock filesystem operations
jest.mock('fs/promises');
jest.mock('path');

const mockReadFile = jest.fn();
const mockReaddir = jest.fn();
const mockWriteFile = jest.fn();
const mockStat = jest.fn();

require('fs/promises').readFile = mockReadFile;
require('fs/promises').readdir = mockReaddir;
require('fs/promises').writeFile = mockWriteFile;
require('fs/promises').stat = mockStat;

describe('Multi-Workstream API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Demo Loops API (/api/demo-loops)', () => {
    it('should return workstream-specific loops when workstream parameter provided', async () => {
      // Mock file system
      mockReaddir.mockResolvedValue(['task-ora-123.md', 'task-mecca-456.md', 'task-sales-789.md']);
      
      mockReadFile
        .mockResolvedValueOnce(`---
workstream: ora
title: Ora Task
status: complete
---
# Ora Task Content`)
        .mockResolvedValueOnce(`---
workstream: mecca
title: Mecca Task
status: planning
---
# Mecca Task Content`)
        .mockResolvedValueOnce(`---
workstream: sales
title: Sales Task
status: in_progress
---
# Sales Task Content`);

      // Import and test the API route
      const { GET } = await import('../app/api/demo-loops/route');
      
      // Test Ora workstream
      const oraRequest = new NextRequest('http://localhost:3000/api/demo-loops?workstream=ora');
      const oraResponse = await GET(oraRequest);
      const oraData = await oraResponse.json();
      
      expect(oraData).toHaveLength(1);
      expect(oraData[0].workstream).toBe('ora');
      expect(oraData[0].title).toBe('Ora Task');

      // Test Mecca workstream
      const meccaRequest = new NextRequest('http://localhost:3000/api/demo-loops?workstream=mecca');
      const meccaResponse = await GET(meccaRequest);
      const meccaData = await meccaResponse.json();
      
      expect(meccaData).toHaveLength(1);
      expect(meccaData[0].workstream).toBe('mecca');
      expect(meccaData[0].title).toBe('Mecca Task');
    });

    it('should default to Ora workstream when no workstream specified', async () => {
      mockReaddir.mockResolvedValue(['task-123.md']);
      mockReadFile.mockResolvedValue(`---
title: Default Task
status: complete
---
# Default Task Content`);

      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data[0].workstream).toBe('Ora'); // Should default to Ora
    });

    it('should handle empty workstream gracefully', async () => {
      mockReaddir.mockResolvedValue([]);

      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=nonexistent');
      const response = await GET(request);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });
  });

  describe('System Docs API (/api/system-docs)', () => {
    it('should load workstream-specific roadmaps', async () => {
      // Mock workstream-specific roadmap files
      mockReaddir.mockResolvedValue(['roadmap.md']);
      mockStat.mockResolvedValue({ isFile: () => true, size: 1024, mtime: new Date() });
      
      mockReadFile.mockResolvedValue(`---
title: Mecca Project Roadmap
workstream: mecca
---

# Mecca Project Roadmap

## Phase 1: Foundation and Planning
- Strategic business development
`);

      const { GET } = await import('../app/api/system-docs/route');
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=roadmap.md&workstream=mecca');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.selectedFile.rawContent).toContain('Mecca Project Roadmap');
      expect(data.selectedFile.rawContent).toContain('Strategic business development');
    });

    it('should fall back to main docs when workstream-specific file not found', async () => {
      mockReaddir.mockResolvedValue(['roadmap.md']);
      mockStat.mockResolvedValue({ isFile: () => true, size: 2048, mtime: new Date() });
      
      mockReadFile.mockResolvedValue(`---
title: Ora System Roadmap
---

# Ora System Roadmap

## Phase 11: Artefact Hierarchy and Filtering
`);

      const { GET } = await import('../app/api/system-docs/route');
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=roadmap.md&workstream=invalidworkstream');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.selectedFile.rawContent).toContain('Ora System Roadmap');
    });
  });

  describe('Task Mutations API (/api/task-mutations)', () => {
    it('should include workstream context in task mutations', async () => {
      const taskData = {
        title: 'Test Task for Mecca',
        workstream: 'mecca',
        status: 'planning',
        description: 'A test task for the Mecca workstream'
      };

      // Mock successful file operations
      mockReaddir.mockResolvedValue(['existing-task.md']);
      mockWriteFile.mockResolvedValue(undefined);

      const { POST } = await import('../app/api/task-mutations/route');
      const request = new NextRequest('http://localhost:3000/api/task-mutations', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('mecca'),
        expect.stringContaining('workstream: mecca')
      );
    });

    it('should validate workstream isolation for batch operations', async () => {
      const batchData = [
        { title: 'Mecca Task 1', workstream: 'mecca', status: 'planning' },
        { title: 'Mecca Task 2', workstream: 'mecca', status: 'in_progress' },
        { title: 'Sales Task', workstream: 'sales', status: 'planning' }
      ];

      mockWriteFile.mockResolvedValue(undefined);

      const { POST } = await import('../app/api/task-mutations/batch/route');
      const request = new NextRequest('http://localhost:3000/api/task-mutations/batch', {
        method: 'POST',
        body: JSON.stringify({ operations: batchData.map(task => ({ type: 'add', data: task })) })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(3);
      
      // Verify workstream isolation in file paths
      const writeCalls = mockWriteFile.mock.calls;
      expect(writeCalls.some((call: any) => call[0].includes('mecca'))).toBe(true);
      expect(writeCalls.some((call: any) => call[0].includes('sales'))).toBe(true);
    });
  });

  describe('Memory Trace API (/api/memory-trace)', () => {
    it('should store workstream context in memory traces', async () => {
      const traceData = {
        type: 'creation',
        artefactId: 'task-123',
        workstream: 'sales',
        description: 'Task created in sales workstream',
        metadata: { user: 'test-user', timestamp: Date.now() }
      };

      mockWriteFile.mockResolvedValue(undefined);

      const { POST } = await import('../app/api/memory-trace/route');
      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(traceData)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('sales')
      );
    });

    it('should retrieve workstream-specific memory traces', async () => {
      const mockTraces = [
        {
          id: 'trace-1',
          workstream: 'mecca',
          type: 'creation',
          description: 'Mecca task created'
        },
        {
          id: 'trace-2', 
          workstream: 'sales',
          type: 'mutation',
          description: 'Sales task updated'
        }
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(mockTraces));

      const { GET } = await import('../app/api/memory-trace/route');
      const request = new NextRequest('http://localhost:3000/api/memory-trace?workstream=mecca');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.filter((trace: any) => trace.workstream === 'mecca')).toHaveLength(1);
    });
  });

  describe('Artefact Chat API (/api/artefact-chat)', () => {
    it('should include workstream context in chat responses', async () => {
      const chatData = {
        artefactId: 'task-123',
        workstream: 'mecca',
        message: 'What is the status of this task?',
        context: {
          title: 'Market Analysis Task',
          status: 'planning',
          phase: '1.1.1'
        }
      };

      const { POST } = await import('../app/api/artefact-chat/route');
      const request = new NextRequest('http://localhost:3000/api/artefact-chat', {
        method: 'POST',
        body: JSON.stringify(chatData)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.response).toContain('Mecca'); // Should reference workstream context
      expect(data.workstream).toBe('mecca');
    });

    it('should handle cross-workstream references appropriately', async () => {
      const chatData = {
        artefactId: 'task-456',
        workstream: 'sales',
        message: 'How does this relate to the Mecca project?',
        context: {
          title: 'Customer Acquisition Strategy',
          status: 'in_progress'
        }
      };

      const { POST } = await import('../app/api/artefact-chat/route');
      const request = new NextRequest('http://localhost:3000/api/artefact-chat', {
        method: 'POST',
        body: JSON.stringify(chatData)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.workstream).toBe('sales');
      // Should acknowledge the cross-workstream query while maintaining context
      expect(data.response).toMatch(/sales|customer|acquisition/i);
    });
  });

  describe('Roadmap API (/api/roadmap)', () => {
    it('should parse workstream-specific roadmaps correctly', async () => {
      const meccaRoadmap = `---
title: Mecca Project Roadmap
workstream: mecca
---

# Mecca Project Roadmap

## Phase 1: Foundation and Planning

### Project 1.1: Strategic Business Development
- Task 1.1.1: Market Analysis
- Task 1.1.2: Competitive Analysis

### Project 1.2: Business Model Framework
- Task 1.2.1: Revenue Streams
`;

      mockReadFile.mockResolvedValue(meccaRoadmap);

      const { GET } = await import('../app/api/roadmap/route');
      const request = new NextRequest('http://localhost:3000/api/roadmap?workstream=mecca');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.workstreams).toContain('mecca');
      expect(data.programs.some((p: any) => p.phase === '1')).toBe(true);
      expect(data.projects.some((p: any) => p.name.includes('Strategic Business Development'))).toBe(true);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid workstream names gracefully', async () => {
      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=<script>alert("xss")</script>');
      const response = await GET(request);
      
      expect(response.status).toBe(200); // Should not crash
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should validate workstream parameters in API requests', async () => {
      const invalidData = {
        title: 'Test Task',
        workstream: '', // Empty workstream
        status: 'planning'
      };

      const { POST } = await import('../app/api/task-mutations/route');
      const request = new NextRequest('http://localhost:3000/api/task-mutations', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      // Should default to 'ora' workstream or handle validation
      expect(data.success).toBeDefined();
    });

    it('should handle filesystem errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=mecca');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toContain('error');
    });
  });

  describe('Performance and Caching', () => {
    it('should handle concurrent requests to different workstreams', async () => {
      mockReaddir.mockResolvedValue(['task-1.md', 'task-2.md']);
      mockReadFile
        .mockResolvedValue(`---
workstream: ora
title: Ora Task
---`)
        .mockResolvedValue(`---
workstream: mecca  
title: Mecca Task
---`);

      const { GET } = await import('../app/api/demo-loops/route');
      
      // Simulate concurrent requests
      const [oraResponse, meccaResponse] = await Promise.all([
        GET(new NextRequest('http://localhost:3000/api/demo-loops?workstream=ora')),
        GET(new NextRequest('http://localhost:3000/api/demo-loops?workstream=mecca'))
      ]);
      
      expect(oraResponse.status).toBe(200);
      expect(meccaResponse.status).toBe(200);
      
      const oraData = await oraResponse.json();
      const meccaData = await meccaResponse.json();
      
      expect(oraData[0].workstream).toBe('Ora');
      expect(meccaData[0].workstream).toBe('mecca');
    });
  });

  describe('Data Migration and Compatibility', () => {
    it('should handle legacy artefacts without workstream field', async () => {
      const legacyArtefact = `---
title: Legacy Task
status: complete
tags: [legacy]
---
# Legacy content without workstream`;

      mockReaddir.mockResolvedValue(['legacy-task.md']);
      mockReadFile.mockResolvedValue(legacyArtefact);

      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data[0].workstream).toBe('Ora'); // Should default to Ora
      expect(data[0].title).toBe('Legacy Task');
    });

    it('should maintain backwards compatibility with existing API contracts', async () => {
      mockReaddir.mockResolvedValue(['test-task.md']);
      mockReadFile.mockResolvedValue(`---
title: Test Task
workstream: ora
status: complete
---`);

      const { GET } = await import('../app/api/demo-loops/route');
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      const response = await GET(request);
      const data = await response.json();
      
      // Should maintain existing API structure
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('status');
      expect(data[0]).toHaveProperty('workstream');
      expect(data[0]).toHaveProperty('filePath');
    });
  });
}); 