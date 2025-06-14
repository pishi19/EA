import { GET } from '../demo-loops/route';
import { NextRequest } from 'next/server';
import { setupFetchMocks, mockWorkstreamApi } from '@/__tests__/test-utils';

// Mock path utilities
jest.mock('@/lib/path-utils', () => ({
  findProjectRoot: jest.fn().mockReturnValue('/test/project/root'),
  getWorkstreamDataPath: jest.fn().mockReturnValue('/test/workstream/path'),
  getWorkstreamLogsPath: jest.fn().mockReturnValue('/test/logs/path')
}));

// Mock workstream API
jest.mock('@/lib/workstream-api', () => mockWorkstreamApi);

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock gray-matter
jest.mock('gray-matter', () => {
  return jest.fn().mockImplementation((content: string) => ({
    data: {
      title: 'Test Artefact',
      status: 'in_progress',
      workstream: 'ora',
      type: 'task',
      tags: ['test'],
      created: '2025-01-01'
    },
    content: 'Test content'
  }));
});

describe('Demo Loops API Integration Tests', () => {
  const fs = require('fs');
  const path = require('path');

  setupFetchMocks();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system responses
    fs.promises.readdir.mockResolvedValue(['test-artefact-1.md', 'test-artefact-2.md']);
    fs.promises.readFile.mockResolvedValue(`---
title: Test Artefact
status: in_progress
workstream: ora
type: task
tags: [test]
created: 2025-01-01
---

# Test Artefact

This is test content.`);
    
    fs.promises.stat.mockResolvedValue({
      isFile: () => true,
      mtime: new Date('2025-01-01')
    });
  });

  describe('Workstream Context Validation', () => {
    it('should return 400 for missing workstream parameter', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing or invalid workstream parameter');
    });

    it('should return 400 for invalid workstream parameter', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=invalid');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'invalid',
        isValid: false,
        source: 'query'
      });
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing or invalid workstream parameter');
    });

    it('should accept valid workstream parameter', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockWorkstreamApi.logWorkstreamOperation).toHaveBeenCalledWith({
        workstream: 'ora',
        operation: 'read',
        endpoint: '/api/demo-loops',
        result: 'success',
        artefactCount: expect.any(Number)
      });
    });
  });

  describe('Multi-Workstream Data Isolation', () => {
    it('should return data only for requested workstream', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=mecca');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'mecca',
        isValid: true,
        source: 'query'
      });
      
      // Mock different file content for mecca workstream
      fs.promises.readFile.mockResolvedValue(`---
title: Mecca Artefact
status: complete
workstream: mecca
type: task
---

# Mecca Artefact`);
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.artefacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            workstream: 'mecca',
            title: 'Mecca Artefact'
          })
        ])
      );
    });

    it('should not return cross-workstream data', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      data.artefacts.forEach((artefact: any) => {
        expect(artefact.workstream.toLowerCase()).toBe('ora');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      fs.promises.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.artefacts).toEqual([]);
    });

    it('should handle malformed markdown files', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      fs.promises.readFile.mockResolvedValue('Invalid markdown content');
      const grayMatter = require('gray-matter');
      grayMatter.mockImplementation(() => {
        throw new Error('Invalid frontmatter');
      });
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.artefacts).toEqual([]);
    });

    it('should log operation failures', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      fs.promises.readdir.mockRejectedValue(new Error('Access denied'));
      
      await GET(request);
      
      expect(mockWorkstreamApi.logWorkstreamOperation).toHaveBeenCalledWith({
        workstream: 'ora',
        operation: 'read',
        endpoint: '/api/demo-loops',
        result: 'success',
        artefactCount: 0
      });
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle large numbers of artefacts', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      // Mock 100 files
      const manyFiles = Array.from({ length: 100 }, (_, i) => `artefact-${i}.md`);
      fs.promises.readdir.mockResolvedValue(manyFiles);
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.artefacts).toHaveLength(100);
    });

    it('should return response within reasonable time', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Response Format Validation', () => {
    it('should return correctly formatted response structure', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      const response = await GET(request);
      expect(response.status).toBe(200);
      
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
      }
    });

    it('should include proper CORS headers', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      const response = await GET(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Audit and Logging', () => {
    it('should log all successful operations', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=ora');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'ora',
        isValid: true,
        source: 'query'
      });
      
      await GET(request);
      
      expect(mockWorkstreamApi.logWorkstreamOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          workstream: 'ora',
          operation: 'read',
          endpoint: '/api/demo-loops',
          result: 'success'
        })
      );
    });

    it('should log workstream validation failures', async () => {
      const request = new NextRequest('http://localhost/api/demo-loops?workstream=invalid');
      mockWorkstreamApi.extractWorkstreamContext.mockResolvedValueOnce({
        workstream: 'invalid',
        isValid: false,
        source: 'query'
      });
      
      await GET(request);
      
      expect(mockWorkstreamApi.logWorkstreamOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          workstream: 'invalid',
          operation: 'read',
          endpoint: '/api/demo-loops',
          result: 'error',
          error: 'Missing or invalid workstream parameter'
        })
      );
    });
  });
}); 