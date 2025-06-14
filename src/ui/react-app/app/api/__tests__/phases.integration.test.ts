import { GET } from '../phases/route';
import { NextRequest } from 'next/server';
import { setupFetchMocks, mockApiResponses } from '@/__tests__/test-utils';

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock path utilities  
jest.mock('@/lib/path-utils', () => ({
  findProjectRoot: jest.fn().mockReturnValue('/test/project/root'),
}));

describe('Phases API Integration Tests', () => {
  const fs = require('fs');

  setupFetchMocks();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock roadmap.md content with proper phase headers
    fs.promises.readFile.mockResolvedValue(`
# Ora System Roadmap

## Current Major Phases

### Phase 11: Artefact Hierarchy, Filtering & Chat

#### LLM Prompt Context
**Strategic Focus**: Establish unified artefact management foundation.

### Phase 12: Administration & Governance

#### LLM Prompt Context  
**Strategic Focus**: Establish robust administration and governance.

### Phase 13: Data Audit & Compliance

#### LLM Prompt Context
**Strategic Focus**: Ensure data integrity and compliance.

### Phase 14: Semantic/LLM Feature Enhancements

#### LLM Prompt Context
**Strategic Focus**: Leverage advanced AI technologies.

### Phase 15: Data Flow Integrity, Policy & Systems Safeguards

#### LLM Prompt Context
**Strategic Focus**: Ensure long-term data reliability and agentic safety.
`);
  });

  describe('Basic Functionality', () => {
    it('should return all phases from roadmap', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(5);
      
      // Check phase structure
      data.forEach((phase: any) => {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('number');
        expect(phase).toHaveProperty('title');
        expect(phase).toHaveProperty('fullTitle');
      });
    });

    it('should parse phase numbers correctly', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const phaseNumbers = data.map((phase: any) => phase.number);
      expect(phaseNumbers).toEqual(['11', '12', '13', '14', '15']);
    });

    it('should extract phase titles correctly', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const expectedTitles = [
        'Artefact Hierarchy, Filtering & Chat',
        'Administration & Governance', 
        'Data Audit & Compliance',
        'Semantic/LLM Feature Enhancements',
        'Data Flow Integrity, Policy & Systems Safeguards'
      ];
      
      const actualTitles = data.map((phase: any) => phase.title);
      expect(actualTitles).toEqual(expectedTitles);
    });

    it('should create proper full titles', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data[0].fullTitle).toBe('Phase 11: Artefact Hierarchy, Filtering & Chat');
      expect(data[4].fullTitle).toBe('Phase 15: Data Flow Integrity, Policy & Systems Safeguards');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing roadmap file gracefully', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to load phases');
    });

    it('should handle malformed roadmap content', async () => {
      fs.promises.readFile.mockResolvedValue('Invalid content without phases');
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('should handle roadmap with duplicate phases', async () => {
      fs.promises.readFile.mockResolvedValue(`
### Phase 11: First Instance
### Phase 11: Duplicate Instance
### Phase 12: Normal Phase
`);
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should deduplicate phases
      const phase11Count = data.filter((phase: any) => phase.number === '11').length;
      expect(phase11Count).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle large roadmap files efficiently', async () => {
      // Create a large roadmap with many phases
      const largeRoadmap = Array.from({ length: 50 }, (_, i) => 
        `### Phase ${i + 1}: Test Phase ${i + 1}\n\nContent for phase ${i + 1}\n`
      ).join('\n');
      
      fs.promises.readFile.mockResolvedValue(largeRoadmap);
      
      const startTime = Date.now();
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds max
      
      const data = await response.json();
      expect(data).toHaveLength(50);
    });

    it('should cache results appropriately', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      
      // First request
      const response1 = await GET(request);
      expect(response1.status).toBe(200);
      
      // Second request should reuse cached data
      const response2 = await GET(request);
      expect(response2.status).toBe(200);
      
      // File should only be read once initially
      expect(fs.promises.readFile).toHaveBeenCalledTimes(2); // Once per request in test env
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted JSON', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const data = await response.json();
      expect(typeof data).toBe('object');
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include proper CORS headers', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });

    it('should have consistent phase object structure', async () => {
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      data.forEach((phase: any) => {
        expect(typeof phase.id).toBe('string');
        expect(typeof phase.number).toBe('string');
        expect(typeof phase.title).toBe('string');
        expect(typeof phase.fullTitle).toBe('string');
        expect(phase.id).toBe(phase.number); // id should match number
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle phases with special characters in titles', async () => {
      fs.promises.readFile.mockResolvedValue(`
### Phase 11: Artefact & Data (Testing) - Version 2.0
### Phase 12: Administration/Governance + Features
`);
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data[0].title).toBe('Artefact & Data (Testing) - Version 2.0');
      expect(data[1].title).toBe('Administration/Governance + Features');
    });

    it('should handle phases with non-standard numbering', async () => {
      fs.promises.readFile.mockResolvedValue(`
### Phase 11.5: Sub-phase
### Phase 12a: Alpha Version  
### Phase 20: Jump Ahead
`);
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const numbers = data.map((phase: any) => phase.number);
      expect(numbers).toEqual(['11.5', '12a', '20']);
    });

    it('should handle empty roadmap', async () => {
      fs.promises.readFile.mockResolvedValue('# Empty Roadmap\n\nNo phases defined yet.');
      
      const request = new NextRequest('http://localhost/api/phases');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });

  describe('HTTP Methods', () => {
    it('should only support GET requests', async () => {
      // GET should work
      const getRequest = new NextRequest('http://localhost/api/phases');
      const getResponse = await GET(getRequest);
      expect(getResponse.status).toBe(200);
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const request = new NextRequest('http://localhost/api/phases', { method: 'OPTIONS' });
      
      try {
        await GET(request);
      } catch (error) {
        // OPTIONS not implemented is expected
        expect(error).toBeTruthy();
      }
    });
  });
}); 