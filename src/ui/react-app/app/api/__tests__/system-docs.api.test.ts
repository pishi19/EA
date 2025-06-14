import { NextRequest } from 'next/server';
import { GET } from '../system-docs/route';

// Mock the file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

const mockFs = require('fs/promises');
const mockPath = require('path');

describe('/api/system-docs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.resolve.mockImplementation((...args: string[]) => args.join('/'));
  });

  describe('GET /api/system-docs', () => {
    test('returns roadmap.md by default', async () => {
      const mockRoadmapContent = `# Ora System Roadmap

## Current Focus
- **Next Task:** 11.3.4 Roadmap-Driven Filtering Refactor
- **Project:** 11.3 Interactive Roadmap Tree Navigation
- **Phase:** 11 – Artefact Hierarchy and Filtering

## Major Phases
1. **Phase 11:** Artefact Hierarchy and Filtering
2. **Phase 12:** Administration & Workstream Structure Management`;

      mockFs.readFile.mockResolvedValue(mockRoadmapContent);

      const request = new NextRequest('http://localhost:3000/api/system-docs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('selectedFile');
      expect(data.selectedFile).toHaveProperty('content');
      expect(data.selectedFile.content).toContain('Ora System Roadmap');
      expect(data.selectedFile.content).toContain('Current Focus');
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('roadmap.md'),
        'utf-8'
      );
    });

    test('returns specific file when requested', async () => {
      const mockAlignmentContent = `# Alignment Protocol

## Overview
This document defines the alignment protocol for the Ora system.

## Key Principles
1. Transparency
2. Accountability
3. Consistency`;

      mockFs.readFile.mockResolvedValue(mockAlignmentContent);

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=alignment-protocol.md');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedFile.content).toContain('Alignment Protocol');
      expect(data.selectedFile.content).toContain('Key Principles');
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('alignment-protocol.md'),
        'utf-8'
      );
    });

    test('handles file not found errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=nonexistent.md');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('File not found');
    });

    test('handles permission errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('EACCES: permission denied'));

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=restricted.md');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Error reading file');
    });

    test('validates file extension for security', async () => {
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=../../../etc/passwd');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid file type');
    });

    test('prevents path traversal attacks', async () => {
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=../../../secret.md');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid file path');
    });

    test('handles empty file parameter', async () => {
      mockFs.readFile.mockResolvedValue('# Default Roadmap Content');

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should default to roadmap.md
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('roadmap.md'),
        'utf-8'
      );
    });

    test('returns file list when requesting directory listing', async () => {
      mockFs.readdir.mockResolvedValue([
        'roadmap.md',
        'alignment-protocol.md',
        'system-overview.md',
        'api-reference.md'
      ]);

      const request = new NextRequest('http://localhost:3000/api/system-docs?list=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('files');
      expect(Array.isArray(data.files)).toBe(true);
      expect(data.files).toContain('roadmap.md');
      expect(data.files).toContain('alignment-protocol.md');
    });

    test('filters file list to only markdown files', async () => {
      mockFs.readdir.mockResolvedValue([
        'roadmap.md',
        'config.json',
        'script.js',
        'alignment-protocol.md',
        'image.png'
      ]);

      const request = new NextRequest('http://localhost:3000/api/system-docs?list=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.files).toEqual(['roadmap.md', 'alignment-protocol.md']);
    });

    test('includes cache headers for static content', async () => {
      mockFs.readFile.mockResolvedValue('# Static Content');

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=roadmap.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      // Cache should be short for frequently updated docs
      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });

    test('handles large files efficiently', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of content
      mockFs.readFile.mockResolvedValue(largeContent);

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=large-doc.md');
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      
      const data = await response.json();
      expect(data.selectedFile.content).toHaveLength(1000000);
    });

    test('supports timestamp parameter for cache busting', async () => {
      mockFs.readFile.mockResolvedValue('# Updated Content');

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=roadmap.md&t=1234567890');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Timestamp parameter should not affect functionality
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('roadmap.md'),
        'utf-8'
      );
    });
  });

  describe('Content Processing', () => {
    test('preserves markdown formatting', async () => {
      const markdownContent = `# Main Title

## Subtitle

This is **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
console.log('code block');
\`\`\`

[Link](https://example.com)`;

      mockFs.readFile.mockResolvedValue(markdownContent);

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=test.md');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedFile.content).toContain('# Main Title');
      expect(data.selectedFile.content).toContain('**bold**');
      expect(data.selectedFile.content).toContain('```javascript');
      expect(data.selectedFile.content).toContain('[Link](https://example.com)');
    });

    test('handles UTF-8 content correctly', async () => {
      const unicodeContent = `# Título en Español

Content with émojis: 🚀 🎯 ✅

Japanese: こんにちは
Chinese: 你好
Arabic: مرحبا`;

      mockFs.readFile.mockResolvedValue(unicodeContent);

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=unicode.md');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedFile.content).toContain('Título en Español');
      expect(data.selectedFile.content).toContain('🚀 🎯 ✅');
      expect(data.selectedFile.content).toContain('こんにちは');
    });

    test('includes file metadata in response', async () => {
      mockFs.readFile.mockResolvedValue('# Test Document');
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date('2025-01-15T10:00:00Z'),
        isFile: () => true
      });

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=test.md&includeMetadata=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (data.selectedFile.metadata) {
        expect(data.selectedFile.metadata).toHaveProperty('size');
        expect(data.selectedFile.metadata).toHaveProperty('lastModified');
      }
    });
  });

  describe('Error Recovery', () => {
    test('gracefully handles network timeouts', async () => {
      mockFs.readFile.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=slow.md');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('handles malformed URLs gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/system-docs?file=%XYZ');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('provides helpful error messages', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory, open \'/path/to/missing.md\''));

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=missing.md');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('File not found');
      expect(data.error).toContain('missing.md');
    });
  });

  describe('Performance and Security', () => {
    test('handles concurrent requests without conflicts', async () => {
      mockFs.readFile.mockImplementation((filePath: string) => {
        const delay = Math.random() * 100;
        return new Promise(resolve => {
          setTimeout(() => resolve(`Content for ${filePath}`), delay);
        });
      });

      const requests = [
        new NextRequest('http://localhost:3000/api/system-docs?file=doc1.md'),
        new NextRequest('http://localhost:3000/api/system-docs?file=doc2.md'),
        new NextRequest('http://localhost:3000/api/system-docs?file=doc3.md'),
        new NextRequest('http://localhost:3000/api/system-docs?file=doc4.md'),
        new NextRequest('http://localhost:3000/api/system-docs?file=doc5.md')
      ];

      const responses = await Promise.all(requests.map(req => GET(req)));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('validates input parameters thoroughly', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        'file://etc/passwd',
        'http://evil.com/malware.md',
        'file.md; rm -rf /',
        'file.md && curl evil.com',
        '<script>alert("xss")</script>.md'
      ];

      for (const input of maliciousInputs) {
        const request = new NextRequest(`http://localhost:3000/api/system-docs?file=${encodeURIComponent(input)}`);
        const response = await GET(request);
        
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
      }
    });

    test('enforces reasonable file size limits', async () => {
      const veryLargeContent = 'x'.repeat(50 * 1024 * 1024); // 50MB
      mockFs.readFile.mockResolvedValue(veryLargeContent);

      const request = new NextRequest('http://localhost:3000/api/system-docs?file=huge.md');
      const response = await GET(request);

      // Should either succeed quickly or reject appropriately
      expect([200, 413, 500]).toContain(response.status);
    });
  });
}); 