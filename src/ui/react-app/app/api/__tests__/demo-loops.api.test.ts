import { NextRequest } from 'next/server';
import { GET } from '../demo-loops/route';

// Mock the file system operations
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/'))
}));

// Mock frontmatter parser
jest.mock('front-matter', () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockFs = require('fs/promises');
const mockPath = require('path');
const mockFrontMatter = require('front-matter').default;

describe('/api/demo-loops API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path.join mock
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  describe('GET /api/demo-loops', () => {
    const mockArtefacts = [
      {
        id: 'test-artefact-1',
        name: 'test-artefact-1',
        title: 'Test Artefact 1',
        workstream: 'ora',
        phase: '11.1',
        status: 'complete',
        tags: ['testing', 'api'],
        created: '2025-01-15T10:00:00Z',
        summary: 'Test artefact for API testing',
        filePath: 'runtime/workstreams/ora/artefacts/test-artefact-1.md',
        type: 'task',
        score: 8
      },
      {
        id: 'test-artefact-2',
        name: 'test-artefact-2',
        title: 'Test Artefact 2',
        workstream: 'ora',
        phase: '11.2',
        status: 'in_progress',
        tags: ['development'],
        created: '2025-01-16T14:30:00Z',
        summary: 'Another test artefact',
        filePath: 'runtime/workstreams/ora/artefacts/test-artefact-2.md',
        type: 'task',
        score: 5
      }
    ];

    beforeEach(() => {
      // Mock file system operations
      mockFs.readdir.mockResolvedValue(['test-artefact-1.md', 'test-artefact-2.md']);
      mockFs.stat.mockResolvedValue({ isFile: () => true });
      
      // Mock file reading with frontmatter
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('test-artefact-1.md')) {
          return Promise.resolve(`---
title: Test Artefact 1
workstream: ora
phase: 11.1
status: complete
tags: [testing, api]
created: 2025-01-15T10:00:00Z
type: task
score: 8
---

# Test Artefact 1

Test artefact for API testing`);
        }
        if (filePath.includes('test-artefact-2.md')) {
          return Promise.resolve(`---
title: Test Artefact 2
workstream: ora
phase: 11.2
status: in_progress
tags: [development]
created: 2025-01-16T14:30:00Z
type: task
score: 5
---

# Test Artefact 2

Another test artefact`);
        }
        return Promise.reject(new Error('File not found'));
      });

      // Mock frontmatter parsing
      mockFrontMatter.mockImplementation((content: string) => {
        const lines = content.split('\n');
        const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---');
        
        if (frontmatterEnd > 0) {
          const frontmatterLines = lines.slice(1, frontmatterEnd);
          const attributes: any = {};
          
          frontmatterLines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              const value = valueParts.join(':').trim();
              if (value.startsWith('[') && value.endsWith(']')) {
                attributes[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim());
              } else {
                attributes[key.trim()] = value;
              }
            }
          });
          
          return {
            attributes,
            body: lines.slice(frontmatterEnd + 1).join('\n')
          };
        }
        
        return { attributes: {}, body: content };
      });
    });

    test('returns artefacts for default workstream (ora)', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('artefacts');
      expect(Array.isArray(data.artefacts)).toBe(true);
      expect(data.artefacts).toHaveLength(2);
      
      const artefact1 = data.artefacts.find((a: any) => a.title === 'Test Artefact 1');
      expect(artefact1).toMatchObject({
        title: 'Test Artefact 1',
        workstream: 'ora',
        phase: '11.1',
        status: 'complete',
        tags: ['testing', 'api'],
        type: 'task',
        score: 8
      });
    });

    test('filters artefacts by workstream query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=mecca');
      
      // Setup different directory for mecca workstream
      mockFs.readdir.mockResolvedValue(['mecca-artefact-1.md']);
      mockFs.readFile.mockResolvedValue(`---
title: Mecca Artefact 1
workstream: mecca
phase: 1.1
status: planning
---

# Mecca Artefact 1

Mecca workstream artefact`);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'runtime/workstreams/mecca/artefacts'
      );
    });

    test('returns empty array for non-existent workstream', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=nonexistent');
      
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toEqual([]);
    });

    test('handles file system errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toEqual([]);
    });

    test('filters out directories and non-markdown files', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockResolvedValue([
        'valid-artefact.md',
        'invalid-file.txt',
        'directory-name',
        '.hidden-file.md'
      ]);
      
      mockFs.stat.mockImplementation((filePath: string) => {
        if (filePath.includes('directory-name')) {
          return Promise.resolve({ isFile: () => false });
        }
        return Promise.resolve({ isFile: () => true });
      });
      
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('valid-artefact.md')) {
          return Promise.resolve(`---
title: Valid Artefact
workstream: ora
---
Content`);
        }
        return Promise.reject(new Error('Invalid file'));
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toHaveLength(1);
      expect(data.artefacts[0].title).toBe('Valid Artefact');
    });

    test('handles malformed frontmatter gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockResolvedValue(['malformed.md', 'valid.md']);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('malformed.md')) {
          return Promise.resolve('Invalid frontmatter content without proper structure');
        }
        if (filePath.includes('valid.md')) {
          return Promise.resolve(`---
title: Valid Artefact
workstream: ora
---
Content`);
        }
        return Promise.reject(new Error('File not found'));
      });
      
      mockFrontMatter.mockImplementation((content: string) => {
        if (content.includes('Invalid frontmatter')) {
          throw new Error('Invalid frontmatter');
        }
        return {
          attributes: { title: 'Valid Artefact', workstream: 'ora' },
          body: 'Content'
        };
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toHaveLength(1);
      expect(data.artefacts[0].title).toBe('Valid Artefact');
    });

    test('extracts summary from markdown content', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockResolvedValue(['with-summary.md']);
      mockFs.readFile.mockResolvedValue(`---
title: Artefact with Summary
workstream: ora
---

# Main Title

This is the first paragraph that should become the summary.

This is the second paragraph that should not be included.`);
      
      mockFrontMatter.mockReturnValue({
        attributes: { title: 'Artefact with Summary', workstream: 'ora' },
        body: `# Main Title

This is the first paragraph that should become the summary.

This is the second paragraph that should not be included.`
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts[0].summary).toBe('This is the first paragraph that should become the summary.');
    });

    test('sets default values for missing frontmatter fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockResolvedValue(['minimal.md']);
      mockFs.readFile.mockResolvedValue(`---
title: Minimal Artefact
---
Content`);
      
      mockFrontMatter.mockReturnValue({
        attributes: { title: 'Minimal Artefact' },
        body: 'Content'
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      const artefact = data.artefacts[0];
      expect(artefact.workstream).toBe('ora'); // Default workstream
      expect(artefact.status).toBe('unknown'); // Default status
      expect(artefact.tags).toEqual([]); // Default empty tags
      expect(artefact.type).toBe('task'); // Default type
      expect(artefact.score).toBe(0); // Default score
    });

    test('generates correct file paths and IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=sales');
      
      mockFs.readdir.mockResolvedValue(['sales-task.md']);
      mockFs.readFile.mockResolvedValue(`---
title: Sales Task
workstream: sales
---
Content`);
      
      mockFrontMatter.mockReturnValue({
        attributes: { title: 'Sales Task', workstream: 'sales' },
        body: 'Content'
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      const artefact = data.artefacts[0];
      expect(artefact.id).toBe('sales-task');
      expect(artefact.name).toBe('sales-task');
      expect(artefact.filePath).toContain('runtime/workstreams/sales/artefacts/sales-task.md');
    });

    test('includes request timing in response headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('validates workstream parameter format', async () => {
      // Test with special characters
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=test-workstream_123');
      
      mockFs.readdir.mockResolvedValue([]);
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockPath.join).toHaveBeenCalledWith(
        expect.any(String),
        'runtime/workstreams/test-workstream_123/artefacts'
      );
    });

    test('handles concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/demo-loops')
      );
      
      const responses = await Promise.all(requests.map(req => GET(req)));
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should have called readdir for each request
      expect(mockFs.readdir).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid URL parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops?workstream=');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toEqual([]);
    });

    test('recovers from file reading errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      mockFs.readdir.mockResolvedValue(['good.md', 'bad.md']);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('good.md')) {
          return Promise.resolve(`---
title: Good File
workstream: ora
---
Content`);
        }
        return Promise.reject(new Error('File read error'));
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.artefacts).toHaveLength(1);
      expect(data.artefacts[0].title).toBe('Good File');
    });

    test('handles very large directory listings', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      // Generate 1000 mock files
      const manyFiles = Array.from({ length: 1000 }, (_, i) => `file-${i}.md`);
      mockFs.readdir.mockResolvedValue(manyFiles);
      
      mockFs.readFile.mockResolvedValue(`---
title: Generated File
workstream: ora
---
Content`);
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Response Format', () => {
    test('returns properly structured response', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('artefacts');
      expect(Array.isArray(data.artefacts)).toBe(true);
      
      if (data.artefacts.length > 0) {
        const artefact = data.artefacts[0];
        expect(artefact).toHaveProperty('id');
        expect(artefact).toHaveProperty('name');
        expect(artefact).toHaveProperty('title');
        expect(artefact).toHaveProperty('workstream');
        expect(artefact).toHaveProperty('filePath');
        expect(artefact).toHaveProperty('status');
        expect(artefact).toHaveProperty('tags');
        expect(artefact).toHaveProperty('type');
      }
    });

    test('includes performance metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/demo-loops');
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
}); 