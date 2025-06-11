import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock fs module
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
}));

import fs from 'fs/promises';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/system-docs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (filename?: string) => {
    const url = filename 
      ? `http://localhost:3000/api/system-docs?file=${filename}`
      : 'http://localhost:3000/api/system-docs';
    return new NextRequest(url);
  };

  const mockDocFiles = [
    'roadmap.md',
    'alignment-protocol.md',
    'learning-documentation-onboarding.md',
    'api-reference.md',
    'not-a-markdown.txt'
  ];

  const mockDocContents = {
    'roadmap.md': `---
title: Ora System Roadmap
created: 2025-06-08
tags: [roadmap, phases, planning]
---

# Ora Roadmap

This is the main roadmap document.

## Current Major Phases

1. Phase 11: Artefact Hierarchy and Filtering
2. Phase 12: Administration & Governance`,

    'alignment-protocol.md': `---
title: Alignment Protocol
created: 2025-06-01
tags: [protocol, alignment, standards]
---

# Alignment Protocol

This document defines the alignment protocol for the Ora system.

## Core Principles

1. Transparency
2. Consistency
3. Accountability`,

    'learning-documentation-onboarding.md': `---
title: Learning and Onboarding
created: 2025-05-15
tags: [learning, onboarding, documentation]
---

# Learning and Onboarding

This guide helps new users understand the system.

## Getting Started

Follow these steps to get started with Ora.`,

    'api-reference.md': `---
title: API Reference
created: 2025-06-10
tags: [api, reference, documentation]
---

# API Reference

Complete API documentation for developers.

## Endpoints

### GET /api/system-docs

Returns system documentation.`
  };

  describe('GET without file parameter', () => {
    it('should return list of available documentation files', async () => {
      mockFs.readdir.mockResolvedValue(mockDocFiles as any);
      
      // Mock file stats for filtering
      mockFs.stat.mockImplementation(async (filePath: any) => {
        const filename = filePath.split('/').pop();
        return {
          isFile: () => filename.endsWith('.md'),
          mtime: new Date('2025-06-01')
        } as any;
      });

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      
      // Should only include .md files
      const mdFiles = data.filter((file: any) => file.name.endsWith('.md'));
      expect(mdFiles).toHaveLength(4);
      
      // Check structure of returned file objects
      data.forEach((file: any) => {
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('lastModified');
        expect(typeof file.name).toBe('string');
        expect(typeof file.lastModified).toBe('string');
      });
    });

    it('should handle empty documentation directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should filter out non-markdown files', async () => {
      const mixedFiles = [
        'roadmap.md',
        'readme.txt',
        'config.json',
        'alignment.md',
        'image.png'
      ];
      
      mockFs.readdir.mockResolvedValue(mixedFiles as any);
      mockFs.stat.mockImplementation(async (filePath: any) => {
        const filename = filePath.split('/').pop();
        return {
          isFile: () => true,
          mtime: new Date('2025-06-01')
        } as any;
      });

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Should only include .md files
      expect(data).toHaveLength(2);
      expect(data.every((file: any) => file.name.endsWith('.md'))).toBe(true);
    });
  });

  describe('GET with file parameter', () => {
    beforeEach(() => {
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        const filename = filePath.split('/').pop();
        const content = mockDocContents[filename as keyof typeof mockDocContents];
        if (!content) {
          throw new Error('File not found');
        }
        return content;
      });
    });

    it('should return specific documentation file content', async () => {
      const request = createMockRequest('roadmap.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('metadata');
      
      expect(data.content).toContain('# Ora Roadmap');
      expect(data.content).toContain('Phase 11: Artefact Hierarchy and Filtering');
      
      expect(data.metadata).toMatchObject({
        title: 'Ora System Roadmap',
        created: '2025-06-08',
        tags: ['roadmap', 'phases', 'planning']
      });
    });

    it('should return alignment protocol document', async () => {
      const request = createMockRequest('alignment-protocol.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toContain('# Alignment Protocol');
      expect(data.content).toContain('Core Principles');
      
      expect(data.metadata.title).toBe('Alignment Protocol');
      expect(data.metadata.tags).toContain('protocol');
    });

    it('should handle files with long names', async () => {
      const request = createMockRequest('learning-documentation-onboarding.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toContain('# Learning and Onboarding');
      expect(data.metadata.title).toBe('Learning and Onboarding');
    });

    it('should return 404 for non-existent files', async () => {
      const request = createMockRequest('non-existent.md');
      const response = await GET(request);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'File not found');
    });

    it('should handle files without frontmatter gracefully', async () => {
      const contentWithoutFrontmatter = `# Simple Document

This is a simple markdown document without frontmatter.

## Section 1

Some content here.`;

      mockFs.readFile.mockResolvedValueOnce(contentWithoutFrontmatter);

      const request = createMockRequest('simple.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toContain('# Simple Document');
      expect(data.metadata).toEqual({});
    });

    it('should handle malformed frontmatter', async () => {
      const malformedFrontmatter = `---
title: Test
invalid yaml: [unclosed
---

# Document with bad frontmatter

Content here.`;

      mockFs.readFile.mockResolvedValueOnce(malformedFrontmatter);

      const request = createMockRequest('malformed.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toContain('# Document with bad frontmatter');
      // Should handle gracefully, possibly with empty metadata
      expect(data).toHaveProperty('metadata');
    });

    it('should prevent path traversal attacks', async () => {
      const request = createMockRequest('../../../etc/passwd');
      const response = await GET(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Invalid file path');
    });

    it('should reject non-markdown file requests', async () => {
      const request = createMockRequest('config.txt');
      const response = await GET(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Only markdown files are allowed');
    });

    it('should handle file read permission errors', async () => {
      const permissionError = new Error('EACCES: permission denied');
      (permissionError as any).code = 'EACCES';
      mockFs.readFile.mockRejectedValueOnce(permissionError);

      const request = createMockRequest('roadmap.md');
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('response format validation', () => {
    it('should set correct content-type for file listing', async () => {
      mockFs.readdir.mockResolvedValue(['roadmap.md']);
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date()
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should set correct content-type for file content', async () => {
      mockFs.readFile.mockResolvedValue(mockDocContents['roadmap.md']);

      const request = createMockRequest('roadmap.md');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include cache headers for file content', async () => {
      mockFs.readFile.mockResolvedValue(mockDocContents['roadmap.md']);

      const request = createMockRequest('roadmap.md');
      const response = await GET(request);

      // Should include some form of caching headers
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      mockFs.readFile.mockResolvedValueOnce('');

      const request = createMockRequest('empty.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toBe('');
      expect(data.metadata).toEqual({});
    });

    it('should handle very large files', async () => {
      const largeContent = '# Large Document\n\n' + 'This is a very long line. '.repeat(10000);
      mockFs.readFile.mockResolvedValueOnce(largeContent);

      const request = createMockRequest('large.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content.length).toBeGreaterThan(100000);
    });

    it('should handle files with special characters in content', async () => {
      const specialContent = `---
title: Special Characters
---

# Document with Special Characters 🚀

Content with unicode: café, naïve, résumé
Code blocks with \`backticks\`
Math: α + β = γ
Quotes: "Hello" and 'World'`;

      mockFs.readFile.mockResolvedValueOnce(specialContent);

      const request = createMockRequest('special.md');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.content).toContain('🚀');
      expect(data.content).toContain('café');
      expect(data.content).toContain('α + β = γ');
    });

    it('should handle concurrent requests efficiently', async () => {
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        // Simulate file read delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockDocContents['roadmap.md'];
      });

      const requests = [
        createMockRequest('roadmap.md'),
        createMockRequest('roadmap.md'),
        createMockRequest('roadmap.md')
      ];

      const responses = await Promise.all(
        requests.map(req => GET(req))
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should have called readFile for each request
      expect(mockFs.readFile).toHaveBeenCalledTimes(3);
    });
  });
}); 