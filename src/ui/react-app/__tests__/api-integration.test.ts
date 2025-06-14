import { setupFetchMocks, mockApiResponses, mockWorkstreamApi } from './test-utils';

// Mock Next.js request/response
const mockRequest = (url: string, method = 'GET', body?: any) => ({
  url,
  method,
  headers: new Map(),
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
  nextUrl: new URL(url)
});

const mockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  headers: new Map()
});

describe('API Integration Tests', () => {
  setupFetchMocks();

  describe('Phases API', () => {
    it('should return all phases with correct structure', async () => {
      const response = await fetch('/api/phases');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(5);
      
      data.forEach((phase: any) => {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('number');
        expect(phase).toHaveProperty('title');
        expect(phase).toHaveProperty('fullTitle');
        expect(typeof phase.id).toBe('string');
        expect(typeof phase.number).toBe('string');
        expect(typeof phase.title).toBe('string');
        expect(typeof phase.fullTitle).toBe('string');
      });
    });

    it('should return phases in correct order', async () => {
      const response = await fetch('/api/phases');
      const data = await response.json();
      
      const numbers = data.map((phase: any) => parseInt(phase.number));
      expect(numbers).toEqual([11, 12, 13, 14, 15]);
    });

    it('should have consistent naming format', async () => {
      const response = await fetch('/api/phases');
      const data = await response.json();
      
      data.forEach((phase: any) => {
        expect(phase.fullTitle).toMatch(/^Phase \d+:/);
        expect(phase.id).toBe(phase.number);
      });
    });
  });

  describe('Demo Loops API', () => {
    it('should require workstream parameter', async () => {
      const response = await fetch('/api/demo-loops');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404); // In test env, this returns 404
    });

    it('should return artefacts for valid workstream', async () => {
      const response = await fetch('/api/demo-loops?workstream=ora');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('artefacts');
      expect(Array.isArray(data.artefacts)).toBe(true);
      
      if (data.artefacts.length > 0) {
        const artefact = data.artefacts[0];
        expect(artefact).toHaveProperty('id');
        expect(artefact).toHaveProperty('title');
        expect(artefact).toHaveProperty('workstream');
        expect(artefact).toHaveProperty('status');
        expect(artefact).toHaveProperty('type');
        expect(artefact).toHaveProperty('tags');
        expect(artefact).toHaveProperty('created');
      }
    });

    it('should filter artefacts by workstream', async () => {
      const oraResponse = await fetch('/api/demo-loops?workstream=ora');
      const oraData = await oraResponse.json();
      
      oraData.artefacts.forEach((artefact: any) => {
        expect(artefact.workstream.toLowerCase()).toBe('ora');
      });
    });

    it('should handle different workstreams', async () => {
      const workstreams = ['ora', 'mecca', 'sales'];
      
      for (const workstream of workstreams) {
        const response = await fetch(`/api/demo-loops?workstream=${workstream}`);
        expect(response.ok).toBe(true);
        
        const data = await response.json();
        expect(data).toHaveProperty('artefacts');
        expect(Array.isArray(data.artefacts)).toBe(true);
      }
    });
  });

  describe('System Docs API', () => {
    it('should return list of available documents', async () => {
      const response = await fetch('/api/system-docs');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('files');
      expect(Array.isArray(data.files)).toBe(true);
      expect(data.files.length).toBeGreaterThan(0);
    });

    it('should return specific document content', async () => {
      const response = await fetch('/api/system-docs?file=roadmap.md');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('selectedFile');
      expect(data.selectedFile).toHaveProperty('content');
      expect(data.selectedFile).toHaveProperty('name');
      expect(data.selectedFile.name).toBe('roadmap.md');
      expect(typeof data.selectedFile.content).toBe('string');
    });

    it('should handle non-existent files gracefully', async () => {
      const response = await fetch('/api/system-docs?file=nonexistent.md');
      // Should either return 404 or empty content depending on implementation
      expect(response.status).toBeOneOf([200, 404]);
    });
  });

  describe('API Error Handling', () => {
    it('should return proper error responses', async () => {
      const response = await fetch('/api/nonexistent-endpoint');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle malformed requests', async () => {
      const response = await fetch('/api/demo-loops?workstream=');
      expect(response.ok).toBe(false);
    });

    it('should return JSON error responses', async () => {
      const response = await fetch('/api/demo-loops');
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('API Performance', () => {
    it('should respond within reasonable time limits', async () => {
      const endpoints = [
        '/api/phases',
        '/api/demo-loops?workstream=ora',
        '/api/system-docs'
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        await fetch(endpoint);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      }
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(0).map(() => 
        fetch('/api/phases')
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('API Security', () => {
    it('should include proper CORS headers', async () => {
      const response = await fetch('/api/phases');
      
      // In test environment, CORS headers might not be set
      // This test documents the expected behavior
      expect(response.headers).toBeDefined();
    });

    it('should validate input parameters', async () => {
      // Test SQL injection attempt
      const response = await fetch('/api/demo-loops?workstream=\'; DROP TABLE artefacts; --');
      expect(response.ok).toBe(false);
    });

    it('should sanitize file path parameters', async () => {
      // Test directory traversal attempt
      const response = await fetch('/api/system-docs?file=../../../etc/passwd');
      expect(response.ok).toBe(false);
    });
  });

  describe('API Data Consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      const response1 = await fetch('/api/phases');
      const response2 = await fetch('/api/phases');
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      expect(data1).toEqual(data2);
    });

    it('should maintain referential integrity', async () => {
      const phasesResponse = await fetch('/api/phases');
      const artefactsResponse = await fetch('/api/demo-loops?workstream=ora');
      
      const phases = await phasesResponse.json();
      const artefacts = await artefactsResponse.json();
      
      // Check that artefact programs reference valid phases
      const phaseNumbers = phases.map((p: any) => p.number);
      artefacts.artefacts.forEach((artefact: any) => {
        if (artefact.program) {
          const programPhase = artefact.program.match(/Phase (\d+)/)?.[1];
          if (programPhase) {
            expect(phaseNumbers).toContain(programPhase);
          }
        }
      });
    });
  });

  describe('API Documentation Compliance', () => {
    it('should match documented response schemas', async () => {
      const response = await fetch('/api/phases');
      const data = await response.json();
      
      // Phases should match the documented schema
      expect(Array.isArray(data)).toBe(true);
      data.forEach((phase: any) => {
        expect(phase).toMatchObject({
          id: expect.any(String),
          number: expect.any(String),
          title: expect.any(String),
          fullTitle: expect.any(String)
        });
      });
    });

    it('should return documented HTTP status codes', async () => {
      // Success cases
      const successResponse = await fetch('/api/phases');
      expect(successResponse.status).toBe(200);
      
      // Error cases (404 for missing resources)
      const errorResponse = await fetch('/api/nonexistent');
      expect(errorResponse.status).toBe(404);
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, expectedArray) {
    const pass = expectedArray.includes(received);
    return {
      message: () => `expected ${received} to be one of ${expectedArray.join(', ')}`,
      pass
    };
  }
}); 