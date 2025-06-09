import { NextRequest } from 'next/server';
import { GET } from '../roadmap/route';

// Mock fs and path modules
jest.mock('fs/promises', () => ({
    readFile: jest.fn(),
}));

jest.mock('path', () => ({
    resolve: jest.fn(),
    join: jest.fn(),
}));

const mockReadFile = jest.mocked(require('fs/promises').readFile);
const mockPath = jest.mocked(require('path'));

describe('/api/roadmap', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPath.resolve.mockImplementation((...paths: string[]) => paths.join('/'));
        mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'));
    });

    test('returns roadmap data successfully', async () => {
        const mockRoadmapYaml = `
version: "2.0"
project:
  name: "Test Project"
  version: "1.0"

phases:
  phase-10:
    name: "Phase 10"
    status: "complete"
    score: 0.95
    loops:
      - filename: "test-loop-1.md"
        name: "Test Loop 1"
        status: "complete"
        score: 0.9
      - filename: "test-loop-2.md"
        name: "Test Loop 2"
        status: "in_progress"
        score: 0.8
  phase-11:
    name: "Phase 11"
    status: "in_progress"
    score: 0.7
    loops:
      - filename: "test-loop-3.md"
        name: "Test Loop 3"
        status: "planning"
        score: 0.6
`;

        const mockLoopContent = `---
title: "Test Loop"
uuid: "test-uuid-123"
created: "2023-12-13T10:30:00.000Z"
phase: "phase-10"
workstream: "workstream-ui"
status: "complete"
score: 0.9
tags: ["ui", "testing"]
summary: "Test loop summary"
---

# Test Loop Content
`;

        mockReadFile.mockImplementation((filePath: any) => {
            if (filePath.toString().includes('system_roadmap.yaml')) {
                return Promise.resolve(mockRoadmapYaml);
            }
            if (filePath.toString().includes('.md')) {
                return Promise.resolve(mockLoopContent);
            }
            return Promise.reject(new Error('File not found'));
        });

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.project).toEqual({
            name: "Test Project",
            version: "1.0"
        });
        expect(data.phases).toHaveLength(2);
        expect(data.phases[0].name).toBe("Phase 10");
        expect(data.phases[0].loops).toHaveLength(2);
    });

    test('handles missing roadmap file', async () => {
        mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'Failed to load roadmap',
            details: 'ENOENT: no such file or directory'
        });
    });

    test('handles malformed YAML', async () => {
        const invalidYaml = `
invalid: yaml: content:
  - malformed
    structure
`;

        mockFs.readFile.mockResolvedValue(invalidYaml);

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'Failed to parse roadmap YAML',
            details: expect.stringContaining('bad indentation')
        });
    });

    test('handles missing loop files gracefully', async () => {
        const mockRoadmapYaml = `
phases:
  phase-10:
    name: "Phase 10"
    loops:
      - filename: "missing-loop.md"
        name: "Missing Loop"
`;

        mockFs.readFile.mockImplementation((filePath) => {
            if (filePath.toString().includes('system_roadmap.yaml')) {
                return Promise.resolve(mockRoadmapYaml);
            }
            return Promise.reject(new Error('ENOENT: no such file or directory'));
        });

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.phases[0].loops[0]).toEqual({
            filename: "missing-loop.md",
            name: "Missing Loop",
            enriched: false,
            error: "ENOENT: no such file or directory"
        });
    });

    test('enriches loops with file data', async () => {
        const mockRoadmapYaml = `
phases:
  phase-10:
    name: "Phase 10"
    loops:
      - filename: "enriched-loop.md"
        name: "Enriched Loop"
`;

        const mockLoopContent = `---
title: "Enriched Loop Title"
uuid: "enriched-uuid-123"
created: "2023-12-13T10:30:00.000Z"
workstream: "workstream-ui"
status: "complete"
score: 0.95
tags: ["enriched", "testing"]
summary: "Enriched loop summary"
---

# Enriched Content
`;

        mockFs.readFile.mockImplementation((filePath) => {
            if (filePath.toString().includes('system_roadmap.yaml')) {
                return Promise.resolve(mockRoadmapYaml);
            }
            if (filePath.toString().includes('enriched-loop.md')) {
                return Promise.resolve(mockLoopContent);
            }
            return Promise.reject(new Error('File not found'));
        });

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        const enrichedLoop = data.phases[0].loops[0];
        expect(enrichedLoop.enriched).toBe(true);
        expect(enrichedLoop.title).toBe("Enriched Loop Title");
        expect(enrichedLoop.uuid).toBe("enriched-uuid-123");
        expect(enrichedLoop.workstream).toBe("workstream-ui");
        expect(enrichedLoop.score).toBe(0.95);
    });

    test('handles empty roadmap', async () => {
        const emptyRoadmap = `
version: "2.0"
project:
  name: "Empty Project"
phases: {}
`;

        mockFs.readFile.mockResolvedValue(emptyRoadmap);

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.phases).toEqual([]);
    });

    test('calculates phase statistics correctly', async () => {
        const mockRoadmapYaml = `
phases:
  phase-10:
    name: "Phase 10"
    loops:
      - filename: "loop1.md"
        name: "Loop 1"
        status: "complete"
        score: 0.9
      - filename: "loop2.md"
        name: "Loop 2"
        status: "complete"
        score: 0.8
      - filename: "loop3.md"
        name: "Loop 3"
        status: "in_progress"
        score: 0.7
`;

        const mockLoopContent = `---
title: "Test Loop"
status: "complete"
score: 0.85
---
Content`;

        mockFs.readFile.mockImplementation((filePath) => {
            if (filePath.toString().includes('system_roadmap.yaml')) {
                return Promise.resolve(mockRoadmapYaml);
            }
            return Promise.resolve(mockLoopContent);
        });

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        const phase = data.phases[0];
        expect(phase.totalLoops).toBe(3);
        expect(phase.avgScore).toBeCloseTo(0.8); // (0.9 + 0.8 + 0.7) / 3 = 0.8
    });

    test('handles loops without frontmatter', async () => {
        const mockRoadmapYaml = `
phases:
  phase-10:
    name: "Phase 10"
    loops:
      - filename: "no-frontmatter.md"
        name: "No Frontmatter"
`;

        const mockLoopContent = `# Just Markdown Content

No YAML frontmatter here.`;

        mockFs.readFile.mockImplementation((filePath) => {
            if (filePath.toString().includes('system_roadmap.yaml')) {
                return Promise.resolve(mockRoadmapYaml);
            }
            return Promise.resolve(mockLoopContent);
        });

        const request = new NextRequest('http://localhost:3000/api/roadmap');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        const loop = data.phases[0].loops[0];
        expect(loop.enriched).toBe(true);
        expect(loop.title).toBe("No Frontmatter"); // Fallback to name
        expect(loop.score).toBe(0); // Default score
    });
}); 