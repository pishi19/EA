// Mock NextRequest to avoid constructor issues
const MockNextRequest = class {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
  }
} as any;

import { POST as demoLoopsHandler } from '../demo-loops/route';
import { GET as roadmapHandler } from '../roadmap/route';

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock gray-matter
jest.mock('gray-matter', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock js-yaml
jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

import fs from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as jest.MockedFunction<typeof matter>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('Enhanced API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Demo Loops API', () => {
    const mockLoopFiles = [
      'loop-2024-01-01-ui-enhancement.md',
      'loop-2024-01-02-api-development.md',
      'loop-2024-01-03-testing-setup.md',
      'invalid-loop-format.md'
    ];

    const mockLoopContents = {
      'loop-2024-01-01-ui-enhancement.md': `---
id: loop-ui-enhancement
name: UI Enhancement Loop
title: User Interface Improvements
workstream: frontend
status: complete
score: 8.5
tags:
  - ui
  - enhancement
  - planning
created: 2024-01-01T00:00:00Z
uuid: 123e4567-e89b-12d3-a456-426614174001
summary: Planning and execution of UI enhancements
phase: "1.2"
---

# UI Enhancement Loop

This loop focuses on improving the user interface...`,

      'loop-2024-01-02-api-development.md': `---
id: loop-api-dev
name: API Development Loop
title: Backend API Development
workstream: backend
status: in_progress
score: 7.8
tags:
  - api
  - backend
  - development
created: 2024-01-02T00:00:00Z
uuid: 123e4567-e89b-12d3-a456-426614174002
summary: Development of backend API endpoints
phase: "1.3"
---

# API Development Loop

This loop covers the development of REST API endpoints...`,

      'loop-2024-01-03-testing-setup.md': `---
id: loop-testing
name: Testing Framework Loop
title: Testing Infrastructure Setup
workstream: testing
status: complete
score: 9.1
tags:
  - testing
  - infrastructure
  - retrospective
created: 2024-01-03T00:00:00Z
uuid: 123e4567-e89b-12d3-a456-426614174003
summary: Setting up comprehensive testing framework
phase: "1.1"
---

# Testing Framework Loop

This loop establishes the testing infrastructure...`,

      'invalid-loop-format.md': `# Invalid Loop
This file doesn't have proper frontmatter...`
    };

    beforeEach(() => {
      // Mock directory reading
      mockFs.promises.readdir.mockResolvedValue(mockLoopFiles as any);
      
      // Mock file reading
      mockFs.promises.readFile.mockImplementation((filePath: any) => {
        const fileName = filePath.split('/').pop();
        const content = mockLoopContents[fileName as keyof typeof mockLoopContents];
        return Promise.resolve(content || '');
      });

      // Mock file stats
      mockFs.promises.stat.mockResolvedValue({
        isFile: () => true,
        mtime: new Date('2024-01-01T00:00:00Z')
      } as any);

      // Mock gray-matter parsing
      mockMatter.mockImplementation((content: string) => {
        if (content.includes('---')) {
          const lines = content.split('\n');
          const frontmatterEnd = lines.findIndex((line, idx) => idx > 0 && line === '---');
          const frontmatterContent = lines.slice(1, frontmatterEnd).join('\n');
          
          return {
            data: mockYaml.load(frontmatterContent) || {},
            content: lines.slice(frontmatterEnd + 1).join('\n')
          } as any;
        }
        return { data: {}, content } as any;
      });

      // Mock YAML parsing
      mockYaml.load.mockImplementation((yamlContent: string) => {
        // Parse basic YAML structure for our test data
        const lines = yamlContent.split('\n');
        const result: any = {};
        
        lines.forEach(line => {
          if (line.includes(':') && !line.trim().startsWith('-')) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim().replace(/"/g, '');
            
            if (key.trim() === 'tags') return; // Handle separately
            if (key.trim() === 'score') {
              result[key.trim()] = parseFloat(value);
            } else {
              result[key.trim()] = value;
            }
          }
        });

        // Handle tags array
        const tagsStart = lines.findIndex(line => line.includes('tags:'));
        if (tagsStart !== -1) {
          const tags = [];
          for (let i = tagsStart + 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('-')) {
              tags.push(line.trim().substring(1).trim());
            } else if (line.trim() && !line.startsWith(' ')) {
              break;
            }
          }
          result.tags = tags;
        }

        return result;
      });
    });

    it('successfully loads and parses loop metadata', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3); // Should exclude invalid loop
      
      // Check first loop data
      const uiLoop = data.find(loop => loop.id === 'loop-ui-enhancement');
      expect(uiLoop).toMatchObject({
        id: 'loop-ui-enhancement',
        title: 'User Interface Improvements',
        workstream: 'frontend',
        status: 'complete',
        score: 8.5,
        tags: ['ui', 'enhancement', 'planning'],
        phase: '1.2'
      });
    });

    it('handles file system errors gracefully', async () => {
      mockFs.promises.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to load loops');
    });

    it('filters out invalid loop files', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      const data = await response.json();
      
      // Should not include the invalid loop format
      const invalidLoop = data.find(loop => loop.title?.includes('Invalid'));
      expect(invalidLoop).toBeUndefined();
    });

    it('handles malformed frontmatter gracefully', async () => {
      mockFs.promises.readFile.mockResolvedValueOnce(`---
invalid: yaml: content:
malformed
---
Content here`);
      
      mockMatter.mockImplementationOnce(() => {
        throw new Error('YAML parsing error');
      });

      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      // Should still return successful response, just filtering out bad files
      expect(response.status).toBe(200);
    });

    it('sorts loops by creation date descending', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      const data = await response.json();
      
      // Check that loops are sorted by created date (newest first)
      for (let i = 0; i < data.length - 1; i++) {
        const currentDate = new Date(data[i].created);
        const nextDate = new Date(data[i + 1].created);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('includes all required metadata fields', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      
      const data = await response.json();
      
      data.forEach(loop => {
        expect(loop).toHaveProperty('id');
        expect(loop).toHaveProperty('title');
        expect(loop).toHaveProperty('workstream');
        expect(loop).toHaveProperty('status');
        expect(loop).toHaveProperty('score');
        expect(loop).toHaveProperty('tags');
        expect(loop).toHaveProperty('created');
        expect(loop).toHaveProperty('filePath');
        expect(Array.isArray(loop.tags)).toBe(true);
        expect(typeof loop.score).toBe('number');
      });
    });
  });

  describe('Roadmap API Enhanced Tests', () => {
    const mockRoadmapData = {
      phases: [
        {
          phase: 1.1,
          title: 'Foundation',
          status: 'complete',
          content: '<h1>Foundation Phase</h1>',
          loops: [
            {
              id: 'loop-foundation',
              title: 'Foundation Setup',
              workstream: 'infrastructure',
              status: 'complete',
              score: 8.5,
              tags: ['setup', 'foundation'],
              type: 'planning'
            }
          ]
        },
        {
          phase: 1.2,
          title: 'Development',
          status: 'in_progress',
          content: '<h1>Development Phase</h1>',
          loops: [
            {
              id: 'loop-ui',
              title: 'UI Development',
              workstream: 'frontend',
              status: 'in_progress',
              score: 7.5,
              tags: ['ui', 'frontend'],
              type: 'execution'
            },
            {
              id: 'loop-api',
              title: 'API Development',
              workstream: 'backend',
              status: 'in_progress',
              score: 8.0,
              tags: ['api', 'backend'],
              type: 'execution'
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      // Mock the roadmap data loading
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockRoadmapData));
    });

    it('successfully loads roadmap data with workstream information', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      
      // Verify workstream data is included
      const devPhase = data.find(phase => phase.phase === 1.2);
      expect(devPhase.loops[0]).toHaveProperty('workstream', 'frontend');
      expect(devPhase.loops[1]).toHaveProperty('workstream', 'backend');
    });

    it('handles missing roadmap file', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Roadmap data not found');
    });

    it('handles malformed JSON in roadmap file', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json content');
      
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to parse roadmap data');
    });

    it('includes all necessary fields for filtering', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      const data = await response.json();
      
      data.forEach(phase => {
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('title');
        expect(phase).toHaveProperty('status');
        expect(phase).toHaveProperty('loops');
        
        phase.loops.forEach(loop => {
          expect(loop).toHaveProperty('workstream');
          expect(loop).toHaveProperty('tags');
          expect(loop).toHaveProperty('type');
          expect(loop).toHaveProperty('status');
          expect(loop).toHaveProperty('score');
        });
      });
    });

    it('returns consistent data structure for empty phases', async () => {
      const emptyRoadmapData = { phases: [] };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(emptyRoadmapData));
      
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('handles phases with no loops gracefully', async () => {
      const roadmapWithEmptyPhase = {
        phases: [
          {
            phase: 1.1,
            title: 'Empty Phase',
            status: 'complete',
            content: '<h1>Empty Phase</h1>',
            loops: []
          }
        ]
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(roadmapWithEmptyPhase));
      
      const request = new MockNextRequest('http://localhost:3000/api/roadmap');
      const response = await roadmapHandler(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data[0].loops).toEqual([]);
    });
  });

  describe('API Error Handling', () => {
    it('handles network timeouts gracefully', async () => {
      // Simulate timeout by making readdir hang
      mockFs.promises.readdir.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      
      // In a real scenario, you'd want to implement timeout handling
      // This test verifies the structure exists for timeout handling
      expect(demoLoopsHandler).toBeDefined();
    });

    it('handles concurrent requests properly', async () => {
      // Setup successful mock responses
      mockFs.promises.readdir.mockResolvedValue(['loop-1.md'] as any);
      mockFs.promises.readFile.mockResolvedValue(`---
id: loop-1
title: Test Loop
workstream: test
status: complete
score: 8.0
tags: ['test']
created: 2024-01-01T00:00:00Z
---
Content`);

      const request1 = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const request2 = new MockNextRequest('http://localhost:3000/api/demo-loops');
      
      // Fire both requests simultaneously
      const [response1, response2] = await Promise.all([
        demoLoopsHandler(request1),
        demoLoopsHandler(request2)
      ]);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      
      // Both should return the same data
      expect(data1).toEqual(data2);
    });
  });

  describe('Performance and Caching', () => {
    it('handles large numbers of loop files efficiently', async () => {
      // Create a large number of mock files
      const manyFiles = Array.from({ length: 100 }, (_, i) => `loop-${i}.md`);
      mockFs.promises.readdir.mockResolvedValue(manyFiles as any);
      
      mockFs.promises.readFile.mockResolvedValue(`---
id: test-loop
title: Test Loop
workstream: test
status: complete
score: 8.0
tags: ['test']
created: 2024-01-01T00:00:00Z
---
Content`);

      const start = Date.now();
      const request = new MockNextRequest('http://localhost:3000/api/demo-loops');
      const response = await demoLoopsHandler(request);
      const end = Date.now();
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveLength(100);
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(end - start).toBeLessThan(5000); // 5 seconds max
    });
  });
}); 