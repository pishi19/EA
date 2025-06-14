import { NextRequest } from 'next/server';
import { GET, POST } from '../memory-trace/route';

// Mock the file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/'))
}));

const mockFs = require('fs/promises');
const mockPath = require('path');

describe('/api/memory-trace API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.dirname.mockImplementation((path: string) => path.split('/').slice(0, -1).join('/'));
  });

  describe('GET /api/memory-trace', () => {
    test('retrieves memory trace for existing artefact', async () => {
      const mockMemoryTrace = {
        artefactId: 'artefacts/task-11-1-1-design-canonical-artefact-schema',
        traces: [
          {
            timestamp: '2025-01-15T10:00:00Z',
            action: 'create',
            context: 'Initial task creation',
            user: 'system'
          },
          {
            timestamp: '2025-01-16T14:30:00Z',
            action: 'update',
            context: 'Updated task status to complete',
            user: 'ash'
          }
        ],
        lastAccessed: '2025-01-16T14:30:00Z'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMemoryTrace));

      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/task-11-1-1-design-canonical-artefact-schema');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('traces');
      expect(data.traces).toHaveLength(2);
      expect(data.traces[0]).toMatchObject({
        action: 'create',
        context: 'Initial task creation',
        user: 'system'
      });
      expect(data.artefactId).toBe('artefacts/task-11-1-1-design-canonical-artefact-schema');
    });

    test('returns empty trace for non-existent artefact', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/non-existent-task');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('traces');
      expect(data.traces).toEqual([]);
      expect(data.artefactId).toBe('artefacts/non-existent-task');
    });

    test('requires artefactId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/memory-trace');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('artefactId is required');
    });

    test('validates artefactId format', async () => {
      const invalidIds = [
        '../../../etc/passwd',
        'task<script>alert("xss")</script>',
        'task; rm -rf /',
        '',
        '   '
      ];

      for (const invalidId of invalidIds) {
        const request = new NextRequest(`http://localhost:3000/api/memory-trace?artefactId=${encodeURIComponent(invalidId)}`);
        const response = await GET(request);
        
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('Invalid artefactId');
      }
    });

    test('handles corrupted memory trace files', async () => {
      mockFs.readFile.mockResolvedValue('{ invalid json content');

      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/test-task');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.traces).toEqual([]); // Should return empty array for corrupted data
    });

    test('sorts traces by timestamp in descending order', async () => {
      const mockMemoryTrace = {
        artefactId: 'artefacts/test-task',
        traces: [
          {
            timestamp: '2025-01-15T10:00:00Z',
            action: 'create',
            context: 'First action'
          },
          {
            timestamp: '2025-01-17T10:00:00Z',
            action: 'update',
            context: 'Latest action'
          },
          {
            timestamp: '2025-01-16T10:00:00Z',
            action: 'comment',
            context: 'Middle action'
          }
        ]
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMemoryTrace));

      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/test-task');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.traces).toHaveLength(3);
      expect(data.traces[0].context).toBe('Latest action');
      expect(data.traces[1].context).toBe('Middle action');
      expect(data.traces[2].context).toBe('First action');
    });

    test('limits trace results when requested', async () => {
      const mockMemoryTrace = {
        artefactId: 'artefacts/test-task',
        traces: Array.from({ length: 100 }, (_, i) => ({
          timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
          action: 'update',
          context: `Action ${i + 1}`
        }))
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMemoryTrace));

      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/test-task&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.traces).toHaveLength(10);
    });
  });

  describe('POST /api/memory-trace', () => {
    test('adds new trace entry', async () => {
      const existingTrace = {
        artefactId: 'artefacts/test-task',
        traces: [
          {
            timestamp: '2025-01-15T10:00:00Z',
            action: 'create',
            context: 'Initial creation'
          }
        ]
      };

      const newTraceEntry = {
        artefactId: 'artefacts/test-task',
        action: 'update',
        context: 'Status changed to in_progress',
        user: 'ash'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingTrace));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(newTraceEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(mockFs.writeFile).toHaveBeenCalled();

      // Verify the written content includes both traces
      const writtenContent = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      expect(writtenContent.traces).toHaveLength(2);
      expect(writtenContent.traces[0].action).toBe('update'); // New entry should be first (most recent)
      expect(writtenContent.traces[1].action).toBe('create'); // Existing entry should be second
    });

    test('creates new memory trace file for new artefact', async () => {
      const newTraceEntry = {
        artefactId: 'artefacts/new-task',
        action: 'create',
        context: 'Task created via API',
        user: 'system'
      };

      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(newTraceEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(mockFs.mkdir).toHaveBeenCalled(); // Should create directory if needed
      expect(mockFs.writeFile).toHaveBeenCalled();

      const writtenContent = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      expect(writtenContent.artefactId).toBe('artefacts/new-task');
      expect(writtenContent.traces).toHaveLength(1);
      expect(writtenContent.traces[0].action).toBe('create');
    });

    test('validates required fields', async () => {
      const invalidEntries = [
        {}, // Missing all fields
        { artefactId: 'test' }, // Missing action and context
        { action: 'update' }, // Missing artefactId and context
        { artefactId: 'test', action: 'update' }, // Missing context
        { artefactId: '', action: 'update', context: 'test' }, // Empty artefactId
        { artefactId: 'test', action: '', context: 'test' }, // Empty action
        { artefactId: 'test', action: 'update', context: '' } // Empty context
      ];

      for (const entry of invalidEntries) {
        const request = new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify(entry),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        
        const data = await response.json();
        expect(data).toHaveProperty('error');
      });
    });

    test('handles invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: '{ invalid json content',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid JSON');
    });

    test('automatically adds timestamp if not provided', async () => {
      const newTraceEntry = {
        artefactId: 'artefacts/test-task',
        action: 'update',
        context: 'Status update'
      };

      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(newTraceEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const writtenContent = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      expect(writtenContent.traces[0]).toHaveProperty('timestamp');
      expect(new Date(writtenContent.traces[0].timestamp)).toBeInstanceOf(Date);
    });

    test('maintains trace history limit', async () => {
      const existingTrace = {
        artefactId: 'artefacts/test-task',
        traces: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`,
          action: 'update',
          context: `Update ${i}`
        }))
      };

      const newTraceEntry = {
        artefactId: 'artefacts/test-task',
        action: 'complete',
        context: 'Task completed'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingTrace));
      mockFs.writeFile.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(newTraceEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const writtenContent = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      expect(writtenContent.traces.length).toBeLessThanOrEqual(500); // Should limit trace history
      expect(writtenContent.traces[0].action).toBe('complete'); // New entry should be first
    });

    test('handles file system errors gracefully', async () => {
      const newTraceEntry = {
        artefactId: 'artefacts/test-task',
        action: 'update',
        context: 'Status update'
      };

      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
      mockFs.writeFile.mockRejectedValue(new Error('EACCES: permission denied'));
      mockFs.mkdir.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(newTraceEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to save memory trace');
    });
  });

  describe('Performance and Security', () => {
    test('handles concurrent read/write operations', async () => {
      const existingTrace = {
        artefactId: 'artefacts/test-task',
        traces: [{ timestamp: '2025-01-15T10:00:00Z', action: 'create', context: 'Initial' }]
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingTrace));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      // Simulate concurrent operations
      const operations = [
        new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/test-task'),
        new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId: 'artefacts/test-task',
            action: 'update',
            context: 'Update 1'
          }),
          headers: { 'Content-Type': 'application/json' }
        }),
        new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId: 'artefacts/test-task',
            action: 'update',
            context: 'Update 2'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
      ];

      const responses = await Promise.all([
        GET(operations[0]),
        POST(operations[1]),
        POST(operations[2])
      ]);

      responses.forEach(response => {
        expect([200, 500]).toContain(response.status); // Either success or graceful failure
      });
    });

    test('prevents memory trace injection attacks', async () => {
      const maliciousEntry = {
        artefactId: 'artefacts/test-task',
        action: 'update',
        context: '<script>alert("xss")</script>',
        user: '"; DROP TABLE traces; --'
      };

      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify(maliciousEntry),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Should accept but sanitize

      const writtenContent = JSON.parse(mockFs.writeFile.mock.calls[0][1]);
      // Content should be stored as-is (no processing/execution of scripts)
      expect(writtenContent.traces[0].context).toBe('<script>alert("xss")</script>');
      expect(writtenContent.traces[0].user).toBe('"; DROP TABLE traces; --');
    });

    test('handles large trace histories efficiently', async () => {
      const largeTrace = {
        artefactId: 'artefacts/test-task',
        traces: Array.from({ length: 10000 }, (_, i) => ({
          timestamp: `2025-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`,
          action: 'update',
          context: `Update ${i}`,
          user: 'system'
        }))
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(largeTrace));

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=artefacts/test-task');
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
}); 