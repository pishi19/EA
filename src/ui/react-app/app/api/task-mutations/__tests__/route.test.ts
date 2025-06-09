import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('path');
jest.mock('gray-matter', () => {
    const mockMatter: any = jest.fn().mockImplementation((content: string) => ({
        data: {},
        content: content,
        matter: '',
        stringify: jest.fn()
    }));
    
    mockMatter.stringify = jest.fn((content: string, frontmatter: any) => 
        `---\n${JSON.stringify(frontmatter)}\n---\n${content}`
    );
    
    return mockMatter;
});
jest.mock('../../../../../system/mutation-engine', () => ({
    mutationEngine: {
        validateMarkdownSchema: jest.fn(),
        appendToSection: jest.fn(),
        patchFrontmatter: jest.fn(),
        replaceInSection: jest.fn()
    }
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('/api/task-mutations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock path.join and path.resolve
        mockPath.join.mockImplementation((...segments) => segments.join('/'));
        mockPath.resolve.mockImplementation((...segments) => segments.join('/'));
        mockPath.basename.mockImplementation((filePath) => filePath.split('/').pop() || '');
        
        // Mock process.cwd()
        Object.defineProperty(process, 'cwd', {
            value: jest.fn(() => '/mock/cwd'),
            writable: true
        });
    });

    describe('POST /api/task-mutations', () => {
        it('should create a new task file successfully', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'Test task description',
                status: 'planning' as const,
                phase: '11.2.3',
                workstream: 'testing',
                tags: ['test', 'api']
            };

            const requestBody = {
                action: 'add',
                taskData
            };

            mockFs.writeFile.mockResolvedValue(undefined);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Task added successfully');
            expect(result.fileName).toMatch(/^task-\d+-[a-z0-9]+\.md$/);
            expect(mockFs.writeFile).toHaveBeenCalled();
        });

        it('should add task to existing file', async () => {
            const { mutationEngine } = require('../../../../../system/mutation-engine');
            
            const taskData = {
                title: 'Test Task',
                description: 'Test description',
                status: 'planning' as const,
                phase: '11.2.3',
                workstream: 'testing',
                tags: ['test']
            };

            const requestBody = {
                action: 'add',
                taskData,
                targetFile: 'existing-file.md'
            };

            mutationEngine.validateMarkdownSchema.mockResolvedValue(true);
            mutationEngine.appendToSection.mockResolvedValue(undefined);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Task added successfully');
            expect(result.fileName).toBe('existing-file.md');
            expect(mutationEngine.validateMarkdownSchema).toHaveBeenCalled();
            expect(mutationEngine.appendToSection).toHaveBeenCalledTimes(2);
        });

        it('should edit an existing task successfully', async () => {
            const { mutationEngine } = require('../../../../../system/mutation-engine');
            const matter = require('gray-matter');
            
            const taskData = {
                title: 'Updated Test Task',
                description: 'Updated description',
                status: 'in_progress' as const,
                phase: '11.2.3',
                workstream: 'testing',
                tags: ['test', 'updated']
            };

            const requestBody = {
                action: 'edit',
                taskId: 'existing-task-id',
                taskData
            };

            // Mock file system operations for finding task
            mockFs.readdir.mockResolvedValue(['task-123.md', 'other-file.md'] as any);
            mockFs.readFile.mockResolvedValue('---\nuuid: existing-task-id\n---\nContent');
            
            matter.mockReturnValue({
                data: { uuid: 'existing-task-id', title: 'Old Title' },
                content: 'Content',
                matter: '',
                stringify: jest.fn()
            });

            mutationEngine.patchFrontmatter.mockResolvedValue(undefined);
            mutationEngine.replaceInSection.mockResolvedValue(undefined);
            mutationEngine.appendToSection.mockResolvedValue(undefined);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Task updated successfully');
            expect(mutationEngine.patchFrontmatter).toHaveBeenCalled();
            expect(mutationEngine.replaceInSection).toHaveBeenCalled();
            expect(mutationEngine.appendToSection).toHaveBeenCalled();
        });

        it('should delete a standalone task file', async () => {
            const matter = require('gray-matter');
            
            const requestBody = {
                action: 'delete',
                taskId: 'task-to-delete'
            };

            // Mock finding a standalone task file
            mockFs.readdir.mockResolvedValue(['task-123.md', 'other-file.md'] as any);
            mockFs.readFile.mockResolvedValue('---\nuuid: task-to-delete\n---\nContent');
            
            matter.mockReturnValue({
                data: { uuid: 'task-to-delete' },
                content: 'Content',
                matter: '',
                stringify: jest.fn()
            });

            mockFs.unlink.mockResolvedValue(undefined);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe('Task deleted successfully');
            expect(mockFs.unlink).toHaveBeenCalled();
        });

        it('should handle invalid action type', async () => {
            const requestBody = {
                action: 'invalid-action' as any,
                taskData: {}
            };

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Invalid action');
        });

        it('should handle missing task data for add action', async () => {
            const requestBody = {
                action: 'add'
            };

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Task data is required for add action');
        });

        it('should handle missing task ID for edit action', async () => {
            const requestBody = {
                action: 'edit',
                taskData: { title: 'Test' }
            };

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Task data and task ID are required for edit action');
        });

        it('should handle missing task ID for delete action', async () => {
            const requestBody = {
                action: 'delete'
            };

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Task ID is required for delete action');
        });

        it('should handle task not found for edit', async () => {
            const requestBody = {
                action: 'edit',
                taskId: 'non-existent-task',
                taskData: { title: 'Test' }
            };

            // Mock empty directory
            mockFs.readdir.mockResolvedValue([]);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.message).toBe('Task file not found');
        });

        it('should handle task not found for delete', async () => {
            const requestBody = {
                action: 'delete',
                taskId: 'non-existent-task'
            };

            // Mock empty directory
            mockFs.readdir.mockResolvedValue([]);

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.message).toBe('Task file not found');
        });

        it('should handle file system errors', async () => {
            const taskData = {
                title: 'Test Task',
                status: 'planning' as const,
                phase: '11.2.3',
                workstream: 'testing',
                tags: ['test']
            };

            const requestBody = {
                action: 'add',
                taskData
            };

            mockFs.writeFile.mockRejectedValue(new Error('File system error'));

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.message).toContain('Failed to process task mutation');
        });

        it('should handle invalid JSON request body', async () => {
            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: 'invalid json',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(500);
            expect(result.message).toContain('Failed to process task mutation');
        });

        it('should handle missing action', async () => {
            const requestBody = {};

            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response = await POST(request);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toBe('Action is required');
        });
    });

    describe('GET /api/task-mutations', () => {
        it('should return available actions and requirements', async () => {
            const request = new NextRequest('http://localhost:3000/api/task-mutations', {
                method: 'GET'
            });

            const response = await GET(request);
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.actions).toEqual(['add', 'edit', 'delete']);
            expect(result.addRequires).toEqual(['taskData']);
            expect(result.editRequires).toEqual(['taskData', 'taskId']);
            expect(result.deleteRequires).toEqual(['taskId']);
            expect(result.optionalFields).toEqual(['targetFile']);
        });
    });
}); 