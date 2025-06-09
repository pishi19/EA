import { NextRequest } from 'next/server';
import { GET } from '../demo-loops/route';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('/api/demo-loops', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPath.resolve.mockImplementation((...paths) => paths.join('/'));
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
    });

    test('returns loops successfully', async () => {
        const mockLoopContent = `---
title: "Test Loop"
uuid: "test-uuid-123"
created: "2023-12-13T10:30:00.000Z"
phase: "phase-11-1"
workstream: "workstream-ui"
status: "in_progress"
score: 0.85
tags: ["ui", "testing"]
summary: "Test loop for demo purposes"
---

# Test Loop Content

This is a test loop.

## Chat History

### Human
Test message

### Assistant
Test response
`;

        mockFs.readdir.mockResolvedValue(['test-loop.md'] as any);
        mockFs.readFile.mockResolvedValue(mockLoopContent);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            id: 'test-loop.md',
            name: 'test-loop.md',
            title: 'Test Loop',
            phase: 'phase-11-1',
            workstream: 'workstream-ui',
            status: 'in_progress',
            score: 0.85,
            tags: ['ui', 'testing'],
            created: '2023-12-13T10:30:00.000Z',
            uuid: 'test-uuid-123',
            summary: 'Test loop for demo purposes',
            filePath: expect.stringContaining('test-loop.md'),
            chatHistory: expect.any(Array)
        });
    });

    test('filters out archived files', async () => {
        mockFs.readdir.mockResolvedValue(['test-loop.md', 'archive', 'other-file.txt'] as any);
        mockFs.readFile.mockResolvedValue(`---
title: "Test Loop"
uuid: "test-uuid-123"
---
Content`);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('test-loop.md');
    });

    test('handles missing frontmatter gracefully', async () => {
        const mockLoopContent = `# Test Loop Without Frontmatter

This loop has no YAML frontmatter.`;

        mockFs.readdir.mockResolvedValue(['no-frontmatter.md'] as any);
        mockFs.readFile.mockResolvedValue(mockLoopContent);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            id: 'no-frontmatter.md',
            name: 'no-frontmatter.md',
            title: 'no-frontmatter.md',
            phase: '',
            workstream: '',
            status: '',
            score: 0,
            tags: [],
            created: '',
            uuid: '',
            summary: '',
            filePath: expect.stringContaining('no-frontmatter.md'),
            chatHistory: []
        });
    });

    test('parses chat history correctly', async () => {
        const mockLoopContent = `---
title: "Test Loop"
---

# Test Loop

## Chat History

### Human
First human message

### Assistant  
First assistant response

### Human
Second human message

### Assistant
Second assistant response
`;

        mockFs.readdir.mockResolvedValue(['chat-test.md'] as any);
        mockFs.readFile.mockResolvedValue(mockLoopContent);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        expect(data[0].chatHistory).toHaveLength(4);
        expect(data[0].chatHistory[0]).toEqual({
            role: 'human',
            content: 'First human message'
        });
        expect(data[0].chatHistory[1]).toEqual({
            role: 'assistant',
            content: 'First assistant response'
        });
    });

    test('handles empty directory', async () => {
        mockFs.readdir.mockResolvedValue([] as any);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });

    test('handles file read errors', async () => {
        mockFs.readdir.mockResolvedValue(['error-file.md'] as any);
        mockFs.readFile.mockRejectedValue(new Error('File read error'));

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'Failed to read loops directory',
            details: 'File read error'
        });
    });

    test('handles directory read errors', async () => {
        mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: 'Failed to read loops directory',
            details: 'Directory not found'
        });
    });

    test('handles malformed YAML frontmatter', async () => {
        const mockLoopContent = `---
title: "Test Loop
invalid: yaml: content:
---

Content`;

        mockFs.readdir.mockResolvedValue(['bad-yaml.md'] as any);
        mockFs.readFile.mockResolvedValue(mockLoopContent);

        const request = new NextRequest('http://localhost:3000/api/demo-loops');
        const response = await GET(request);
        const data = await response.json();

        // Should still process the file but with default values
        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('bad-yaml.md');
    });
}); 