import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

describe('/api/memory-trace API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/memory-trace', () => {
    it('retrieves memory trace for valid artefact ID', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=test-task');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('entries');
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('handles missing artefact ID parameter', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace');

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
    });

    it('returns empty entries for new artefact', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=new-task');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toEqual([]);
    });

    it('includes creation entry for existing artefacts', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace?artefactId=task-11-3-1');

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries.length).toBeGreaterThan(0);
      expect(data.entries[0]).toMatchObject({
        type: 'creation',
        source: 'system'
      });
    });
  });

  describe('POST /api/memory-trace', () => {
    it('adds new memory trace entry', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task',
          entry: {
            type: 'chat',
            source: 'user',
            content: 'User asked about next steps',
            timestamp: new Date().toISOString()
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('entryId');
    });

    it('handles invalid JSON body', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });

    it('validates required fields in POST', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task'
          // Missing entry field
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });

    it('validates entry structure', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task',
          entry: {
            // Missing required fields: type, source, content
            timestamp: new Date().toISOString()
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
    });

    it('accepts different entry types', async () => {
      const entryTypes = ['creation', 'chat', 'mutation', 'file_update'];
      
      for (const type of entryTypes) {
        const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId: 'test-task',
            entry: {
              type,
              source: 'system',
              content: `${type} entry`,
              timestamp: new Date().toISOString()
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(mockRequest);
        expect(response.status).toBe(200);
      }
    });

    it('accepts different source types', async () => {
      const sources = ['user', 'assistant', 'system'];
      
      for (const source of sources) {
        const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId: 'test-task',
            entry: {
              type: 'chat',
              source,
              content: `Message from ${source}`,
              timestamp: new Date().toISOString()
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(mockRequest);
        expect(response.status).toBe(200);
      }
    });

    it('handles metadata in entries', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task',
          entry: {
            type: 'mutation',
            source: 'user',
            content: 'Status changed to complete',
            timestamp: new Date().toISOString(),
            metadata: {
              oldStatus: 'in_progress',
              newStatus: 'complete',
              mutationType: 'status'
            }
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Memory Trace Persistence', () => {
    it('persists entries across requests', async () => {
      const artefactId = 'persistence-test-task';
      
      // Add an entry
      const postRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId,
          entry: {
            type: 'chat',
            source: 'user',
            content: 'Test persistence',
            timestamp: new Date().toISOString()
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(postRequest);

      // Retrieve entries
      const getRequest = new NextRequest(`http://localhost:3000/api/memory-trace?artefactId=${artefactId}`);
      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toContainEqual(
        expect.objectContaining({
          type: 'chat',
          source: 'user',
          content: 'Test persistence'
        })
      );
    });

    it('maintains chronological order', async () => {
      const artefactId = 'chronological-test-task';
      
      // Add multiple entries with different timestamps
      const entries = [
        { content: 'First entry', timestamp: '2025-01-20T10:00:00Z' },
        { content: 'Second entry', timestamp: '2025-01-20T11:00:00Z' },
        { content: 'Third entry', timestamp: '2025-01-20T12:00:00Z' }
      ];

      for (const entry of entries) {
        const postRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId,
            entry: {
              type: 'chat',
              source: 'user',
              content: entry.content,
              timestamp: entry.timestamp
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        await POST(postRequest);
      }

      // Retrieve and verify order
      const getRequest = new NextRequest(`http://localhost:3000/api/memory-trace?artefactId=${artefactId}`);
      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries.length).toBeGreaterThanOrEqual(3);
      
      // Should be in chronological order (oldest first)
      const chatEntries = data.entries.filter((e: any) => e.content?.includes('entry'));
      expect(chatEntries[0].content).toBe('First entry');
      expect(chatEntries[1].content).toBe('Second entry');
      expect(chatEntries[2].content).toBe('Third entry');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed timestamps gracefully', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task',
          entry: {
            type: 'chat',
            source: 'user',
            content: 'Test message',
            timestamp: 'invalid-timestamp'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);

      // Should handle gracefully (either accept or reject with proper error)
      expect([200, 400]).toContain(response.status);
    });

    it('handles very long content', async () => {
      const longContent = 'A'.repeat(10000); // 10KB content
      
      const mockRequest = new NextRequest('http://localhost:3000/api/memory-trace', {
        method: 'POST',
        body: JSON.stringify({
          artefactId: 'test-task',
          entry: {
            type: 'chat',
            source: 'user',
            content: longContent,
            timestamp: new Date().toISOString()
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(mockRequest);

      // Should either accept or reject gracefully
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    it('handles concurrent requests', async () => {
      const artefactId = 'concurrent-test-task';
      const requests = Array(10).fill(null).map((_, index) => 
        new NextRequest('http://localhost:3000/api/memory-trace', {
          method: 'POST',
          body: JSON.stringify({
            artefactId,
            entry: {
              type: 'chat',
              source: 'user',
              content: `Concurrent message ${index}`,
              timestamp: new Date().toISOString()
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
}); 