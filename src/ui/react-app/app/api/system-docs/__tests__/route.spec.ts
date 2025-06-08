import { GET } from '../route';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs module
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('/api/system-docs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock path.resolve to return a predictable path
        mockPath.resolve.mockReturnValue('/mock/docs/path');
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
    });

    test('returns file list when no file parameter provided', async () => {
        // Mock fs operations
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['system-design.md', 'roadmap.md'] as any);
        
        // Mock file stats
        const mockStats = {
            size: 1024,
            mtime: new Date('2023-12-13T10:30:00.000Z')
        };
        mockFs.stat.mockResolvedValue(mockStats as any);
        
        // Mock file reading
        mockFs.readFile.mockResolvedValue('---\ntitle: Test Document\ntags: [test]\n---\n# Content');

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.fileList).toHaveLength(2);
        expect(data.selectedFile).toBeNull();
        expect(data.fileList[0].filename).toBe('roadmap.md'); // Should be sorted alphabetically
        expect(data.fileList[0].friendlyName).toBe('Roadmap');
        expect(data.fileList[0].title).toBe('Test Document');
    });

    test('returns specific file content when file parameter provided', async () => {
        // Mock fs operations
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['system-design.md'] as any);
        
        const mockStats = {
            size: 2048,
            mtime: new Date('2023-12-12T15:45:00.000Z')
        };
        mockFs.stat.mockResolvedValue(mockStats as any);
        
        // Mock file reading with frontmatter
        mockFs.readFile.mockResolvedValue('---\ntitle: System Design\ntags: [system, architecture]\n---\n# System Design\n\nContent here');

        const request = new Request('http://localhost/api/system-docs?file=system-design.md');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.selectedFile).toBeDefined();
        expect(data.selectedFile.filename).toBe('system-design.md');
        expect(data.selectedFile.title).toBe('System Design');
        expect(data.selectedFile.content).toContain('<h1>System Design</h1>');
        expect(data.selectedFile.rawContent).toContain('# System Design');
    });

    test('handles file not found error', async () => {
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['other-file.md'] as any);
        
        const request = new Request('http://localhost/api/system-docs?file=missing-file.md');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.message).toBe('File not found');
    });

    test('handles directory not found error', async () => {
        mockFs.access.mockRejectedValue(new Error('Directory not found'));

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.message).toBe('Documentation directory not found');
    });

    test('handles no markdown files found', async () => {
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['readme.txt', 'config.json'] as any);

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.message).toBe('No documentation files found');
    });

    test('handles file parsing error gracefully', async () => {
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['broken-file.md'] as any);
        
        const mockStats = {
            size: 512,
            mtime: new Date('2023-12-13T10:30:00.000Z')
        };
        mockFs.stat.mockResolvedValue(mockStats as any);
        
        // Mock file read error for frontmatter parsing
        mockFs.readFile.mockRejectedValue(new Error('File read error'));

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.fileList).toHaveLength(1);
        expect(data.fileList[0].title).toBe('Broken File'); // Should fallback to friendly name
    });

    test('converts filenames to friendly names correctly', async () => {
        mockFs.access.mockResolvedValue(undefined);
        mockFs.readdir.mockResolvedValue(['system-update-protocol-checklist.md'] as any);
        
        const mockStats = {
            size: 1024,
            mtime: new Date('2023-12-13T10:30:00.000Z')
        };
        mockFs.stat.mockResolvedValue(mockStats as any);
        mockFs.readFile.mockResolvedValue('---\n---\n# Content');

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(data.fileList[0].friendlyName).toBe('System Update Protocol Checklist');
    });

    test('handles internal server error', async () => {
        mockPath.resolve.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const request = new Request('http://localhost/api/system-docs');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.message).toBe('Failed to get system docs data');
        expect(data.error).toBe('Unexpected error');
    });
}); 