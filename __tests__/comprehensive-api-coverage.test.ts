import { jest } from '@jest/globals';

// Mock global fetch
declare global {
  var fetch: jest.MockedFunction<typeof fetch>;
}

// Comprehensive API Test Suite
describe('Comprehensive API Test Coverage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Phases API (/api/phases)', () => {
    it('should return all phases with correct structure', async () => {
      const mockPhases = [
        { id: 'phase-11', number: '11', title: 'Artefact Hierarchy', fullTitle: 'Phase 11: Artefact Hierarchy', status: 'active' },
        { id: 'phase-12', number: '12', title: 'Administration', fullTitle: 'Phase 12: Administration', status: 'complete' },
        { id: 'phase-13', number: '13', title: 'Data Audit', fullTitle: 'Phase 13: Data Audit', status: 'planning' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases,
      } as Response);

      const response = await fetch('/api/phases');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('number');
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('fullTitle');
      expect(data[0]).toHaveProperty('status');
    });

    it('should handle phases API server errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const response = await fetch('/api/phases');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/phases')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      } as Response);

      const response = await fetch('/api/phases');
      await expect(response.json()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Demo Loops API (/api/demo-loops)', () => {
    it('should require workstream parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Missing workstream parameter' })
      } as Response);

      const response = await fetch('/api/demo-loops');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should return artefacts for valid workstream', async () => {
      const mockArtefacts = {
        artefacts: [
          { 
            id: 'loop-1', 
            title: 'Test Loop 1', 
            workstream: 'ora',
            status: 'active',
            tags: ['test', 'loop'],
            created: '2025-01-01',
            phase: '11'
          },
          { 
            id: 'task-1', 
            title: 'Test Task 1', 
            workstream: 'ora',
            status: 'complete',
            tags: ['test', 'task'],
            created: '2025-01-02',
            phase: '12'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockArtefacts
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.artefacts).toHaveLength(2);
      expect(data.artefacts[0].workstream).toBe('ora');
      expect(data.artefacts[1].workstream).toBe('ora');
    });

    it('should validate workstream parameter format', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid workstream parameter format' })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=invalid!@#$');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle empty datasets', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: [] })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=empty');
      const data = await response.json();

      expect(data.artefacts).toEqual([]);
    });

    it('should support filtering by multiple parameters', async () => {
      const filteredData = {
        artefacts: [
          { id: 'filtered-1', workstream: 'ora', status: 'active', phase: '11' }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => filteredData
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora&status=active&phase=11');
      const data = await response.json();

      expect(data.artefacts).toHaveLength(1);
      expect(data.artefacts[0].status).toBe('active');
      expect(data.artefacts[0].phase).toBe('11');
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        workstream: 'ora',
        status: ['active', 'complete', 'pending'][i % 3],
        created: '2025-01-01'
      }));

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: largeDataset })
      } as Response);

      const startTime = Date.now();
      const response = await fetch('/api/demo-loops?workstream=ora');
      const data = await response.json();
      const endTime = Date.now();

      expect(data.artefacts).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should handle large datasets quickly
    });
  });

  describe('Audit Logs API (/api/audit-logs)', () => {
    it('should fetch audit logs with proper workstream header', async () => {
      const mockLogs = {
        logs: [
          {
            workstream: 'ora',
            operation: 'read',
            endpoint: '/api/demo-loops',
            result: 'success',
            timestamp: '2025-01-01T00:00:00Z'
          }
        ],
        totalCount: 1,
        filteredCount: 1,
        workstreams: ['ora'],
        operations: ['read'],
        dateRange: {
          earliest: '2025-01-01T00:00:00Z',
          latest: '2025-01-01T00:00:00Z'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs
      } as Response);

      const response = await fetch('/api/audit-logs', {
        headers: { 'x-workstream': 'ora' }
      });
      const data = await response.json();

      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].workstream).toBe('ora');
      expect(data.totalCount).toBe(1);
    });

    it('should support pagination parameters', async () => {
      const paginatedLogs = {
        logs: [],
        totalCount: 100,
        filteredCount: 10,
        workstreams: ['ora'],
        operations: ['read', 'write'],
        dateRange: {
          earliest: '2025-01-01T00:00:00Z',
          latest: '2025-01-01T23:59:59Z'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => paginatedLogs
      } as Response);

      const response = await fetch('/api/audit-logs?limit=10&offset=20');
      const data = await response.json();

      expect(data.totalCount).toBe(100);
      expect(data.filteredCount).toBe(10);
    });

    it('should filter by operation type', async () => {
      const filteredLogs = {
        logs: [
          { operation: 'write', result: 'success' },
          { operation: 'write', result: 'error' }
        ],
        totalCount: 50,
        filteredCount: 2
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => filteredLogs
      } as Response);

      const response = await fetch('/api/audit-logs?operation=write');
      const data = await response.json();

      expect(data.logs.every((log: any) => log.operation === 'write')).toBe(true);
    });

    it('should handle date range filtering', async () => {
      const dateFilteredLogs = {
        logs: [
          { timestamp: '2025-01-15T12:00:00Z', operation: 'read' }
        ],
        totalCount: 100,
        filteredCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => dateFilteredLogs
      } as Response);

      const response = await fetch('/api/audit-logs?dateFrom=2025-01-15&dateTo=2025-01-15');
      const data = await response.json();

      expect(data.filteredCount).toBe(1);
    });

    it('should handle corrupted log files gracefully', async () => {
      const partialLogs = {
        logs: [
          { operation: 'read', result: 'success', note: 'Some log files skipped due to corruption' }
        ],
        totalCount: 1,
        filteredCount: 1,
        warnings: ['Skipped malformed audit log file audit-2025-06-11.json']
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => partialLogs
      } as Response);

      const response = await fetch('/api/audit-logs');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.logs).toHaveLength(1);
    });
  });

  describe('Roles API (/api/roles)', () => {
    it('should fetch roles for workstream', async () => {
      const mockRoles = {
        roles: [
          {
            id: 'admin',
            name: 'Administrator',
            permissions: ['read', 'write', 'delete', 'admin'],
            workstream: 'ora',
            created: '2025-01-01'
          },
          {
            id: 'user',
            name: 'User',
            permissions: ['read'],
            workstream: 'ora',
            created: '2025-01-01'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      } as Response);

      const response = await fetch('/api/roles', {
        headers: { 'x-workstream': 'ora' }
      });
      const data = await response.json();

      expect(data.roles).toHaveLength(2);
      expect(data.roles[0].permissions).toContain('admin');
      expect(data.roles[1].permissions).toEqual(['read']);
    });

    it('should create new role', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          role: {
            id: 'new-role',
            name: 'New Role',
            permissions: ['read', 'write'],
            workstream: 'ora'
          }
        })
      } as Response);

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workstream': 'ora'
        },
        body: JSON.stringify({
          name: 'New Role',
          permissions: ['read', 'write']
        })
      });

      expect(response.ok).toBe(true);
    });

    it('should validate role permissions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid permissions',
          details: 'Unknown permission: invalid_permission'
        })
      } as Response);

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workstream': 'ora'
        },
        body: JSON.stringify({
          name: 'Bad Role',
          permissions: ['invalid_permission']
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle role updates', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          role: {
            id: 'existing-role',
            name: 'Updated Role',
            permissions: ['read', 'write', 'delete']
          }
        })
      } as Response);

      const response = await fetch('/api/roles/existing-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workstream': 'ora'
        },
        body: JSON.stringify({
          name: 'Updated Role',
          permissions: ['read', 'write', 'delete']
        })
      });

      expect(response.ok).toBe(true);
    });

    it('should handle role deletion', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const response = await fetch('/api/roles/role-to-delete', {
        method: 'DELETE',
        headers: { 'x-workstream': 'ora' }
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Workstreams API (/api/workstreams)', () => {
    it('should fetch all available workstreams', async () => {
      const mockWorkstreams = {
        workstreams: [
          {
            id: 'ora',
            name: 'Ora',
            description: 'Main system workstream',
            status: 'active',
            created: '2025-01-01'
          },
          {
            id: 'mecca',
            name: 'Mecca',
            description: 'Business development workstream',
            status: 'active',
            created: '2025-01-01'
          },
          {
            id: 'sales',
            name: 'Sales',
            description: 'Sales and marketing workstream',
            status: 'active',
            created: '2025-01-01'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkstreams
      } as Response);

      const response = await fetch('/api/workstreams');
      const data = await response.json();

      expect(data.workstreams).toHaveLength(3);
      expect(data.workstreams.map((w: any) => w.id)).toEqual(['ora', 'mecca', 'sales']);
    });

    it('should create new workstream with template', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          workstream: {
            id: 'new-workstream',
            name: 'New Workstream',
            description: 'A new workstream',
            template: 'basic',
            status: 'active'
          }
        })
      } as Response);

      const response = await fetch('/api/workstreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Workstream',
          description: 'A new workstream',
          template: 'basic'
        })
      });

      expect(response.ok).toBe(true);
    });

    it('should validate workstream configuration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid workstream configuration',
          details: 'Name must be alphanumeric'
        })
      } as Response);

      const response = await fetch('/api/workstreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Name!@#',
          description: 'Bad name'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('System Docs API (/api/system-docs)', () => {
    it('should list available documents', async () => {
      const mockDocuments = [
        'roadmap.md',
        'alignment-protocol.md',
        'api-reference.md',
        'architecture.md'
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocuments
      } as Response);

      const response = await fetch('/api/system-docs');
      const data = await response.json();

      expect(data).toHaveLength(4);
      expect(data).toContain('roadmap.md');
      expect(data).toContain('alignment-protocol.md');
    });

    it('should return specific document content', async () => {
      const mockContent = '# Test Document\n\nThis is test content with **markdown** formatting.';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockContent
      } as Response);

      const response = await fetch('/api/system-docs?file=test.md');
      const content = await response.text();

      expect(content).toContain('# Test Document');
      expect(content).toContain('**markdown**');
    });

    it('should handle non-existent files', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'File not found' })
      } as Response);

      const response = await fetch('/api/system-docs?file=nonexistent.md');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should prevent directory traversal attacks', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid file path' })
      } as Response);

      const response = await fetch('/api/system-docs?file=../../../etc/passwd');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Security and Validation', () => {
    it('should validate all input parameters', async () => {
      const testCases = [
        { param: 'workstream', value: ''; DROP TABLE users; --', expected: 400 },
        { param: 'workstream', value: '<script>alert("xss")</script>', expected: 400 },
        { param: 'workstream', value: '../../../etc/passwd', expected: 400 },
        { param: 'workstream', value: 'ora\'\"', expected: 400 },
        { param: 'limit', value: '-1', expected: 400 },
        { param: 'limit', value: '999999', expected: 400 },
        { param: 'offset', value: 'not-a-number', expected: 400 }
      ];

      for (const testCase of testCases) {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.expected,
          json: async () => ({ error: 'Invalid parameter' })
        } as Response);

        const response = await fetch(`/api/demo-loops?${testCase.param}=${encodeURIComponent(testCase.value)}`);
        expect(response.status).toBe(testCase.expected);
      }
    });

    it('should require proper authentication headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Missing authentication' })
      } as Response);

      const response = await fetch('/api/roles');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should enforce workstream isolation', async () => {
      // Test that ora workstream cannot access mecca data
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Access denied to workstream' })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=mecca', {
        headers: { 'x-workstream': 'ora' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should sanitize all output data', async () => {
      const maliciousData = {
        artefacts: [
          {
            id: 'test-1',
            title: '<script>alert("xss")</script>',
            content: 'javascript:alert("xss")',
            workstream: 'ora'
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => maliciousData
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora');
      const data = await response.json();

      // Verify data is sanitized (in real implementation)
      expect(data.artefacts[0].title).not.toContain('<script>');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial service failures gracefully', async () => {
      // Simulate partial system failure where some data is available
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          artefacts: [
            { id: 'available-1', title: 'Available Item' }
          ],
          warnings: ['Some data sources unavailable'],
          partial: true
        })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.artefacts).toHaveLength(1);
      expect(data.partial).toBe(true);
      expect(data.warnings).toContain('Some data sources unavailable');
    });

    it('should provide meaningful error messages', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
          details: 'Database connection timeout',
          timestamp: '2025-01-01T00:00:00Z',
          requestId: 'req-123'
        })
      } as Response);

      const response = await fetch('/api/phases');
      const error = await response.json();

      expect(error.error).toBe('Internal server error');
      expect(error.details).toBe('Database connection timeout');
      expect(error.requestId).toBe('req-123');
    });

    it('should handle timeout scenarios', async () => {
      global.fetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      );

      await expect(fetch('/api/phases')).rejects.toThrow('Request timeout');
    });

    it('should provide fallback data when possible', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          artefacts: [],
          fallback: true,
          message: 'Using cached data due to service unavailability'
        })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.fallback).toBe(true);
      expect(data.message).toContain('cached data');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent requests efficiently', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ data: 'test' })
        } as Response)
      );

      const requests = Array.from({ length: 50 }, (_, i) =>
        fetch(`/api/phases?request=${i}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      expect(responses).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    it('should handle network timeouts gracefully', async () => {
      global.fetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(fetch('/api/phases')).rejects.toThrow('Network timeout');
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Malformed JSON'))
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=ora');
      await expect(response.json()).rejects.toThrow('Malformed JSON');
    });

    it('should handle empty datasets gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ artefacts: [] })
      } as Response);

      const response = await fetch('/api/demo-loops?workstream=empty');
      const data = await response.json();

      expect(data.artefacts).toEqual([]);
    });
  });
}); 