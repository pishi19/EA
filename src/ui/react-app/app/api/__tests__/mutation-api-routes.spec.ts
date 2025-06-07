/// <reference types="@testing-library/jest-dom" />
import { POST, PUT, DELETE } from '../plan-tasks/route';
import { mutationEngine } from '@/system/mutation-engine';
import fs from 'fs/promises';
import { POST as promoteTaskPOST } from '../promote-task/route';
import { POST as chatPOST } from '../chat/route';

// Mock the mutation engine
jest.mock('@/system/mutation-engine', () => ({
    mutationEngine: {
        appendToSection: jest.fn(),
        replaceInSection: jest.fn(),
        validateMarkdownSchema: jest.fn().mockResolvedValue({ valid: true }),
    },
}));

// Mock the file system
jest.mock('fs/promises', () => ({
    readFile: jest.fn(),
    appendFile: jest.fn(),
}));

const mockRequest = (body: any) => ({
    json: async () => body,
}) as any;

describe('Mutation API Routes: /api/plan-tasks', () => {

    beforeEach(() => {
        // Clear all mocks before each test
        (mutationEngine.appendToSection as jest.Mock).mockClear();
        (mutationEngine.replaceInSection as jest.Mock).mockClear();
        (fs.readFile as jest.Mock).mockClear();
    });

    it('POST should add a new user task via mutation engine', async () => {
        console.log('Running test: POST /api/plan-tasks - Add User Task');
        const newTask = { description: 'New user task', added_by: 'user' };
        
        await POST(mockRequest(newTask));

        expect(mutationEngine.appendToSection).toHaveBeenCalledWith(
            expect.any(String), // The file path
            '### User-Defined Tasks',
            expect.any(String) // The formatted task string
        );
        console.log('Test finished: POST /api/plan-tasks - Add User Task');
    });

    it('PUT should update a task via mutation engine', async () => {
        console.log('Running test: PUT /api/plan-tasks - Update Task');
        const updatedTask = { id: 'task-1', description: 'Updated task', section: 'User-Defined Tasks' };
        const mockFileContent = `- [ ] Original task\n\`id: task-1\``;
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        
        await PUT(mockRequest(updatedTask));

        expect(fs.readFile).toHaveBeenCalled();
        expect(mutationEngine.replaceInSection).toHaveBeenCalledWith(
            expect.any(String),
            '### User-Defined Tasks',
            expect.any(String), // original task string
            expect.any(String), // updated task string
            'task-1'
        );
        console.log('Test finished: PUT /api/plan-tasks - Update Task');
    });

    it('DELETE should remove a task via mutation engine', async () => {
        console.log('Running test: DELETE /api/plan-tasks - Delete Task');
        const taskToDelete = { id: 'task-1' };
        const mockFileContent = `- [ ] Task to delete\n\`id: task-1\``;
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        
        await DELETE(mockRequest(taskToDelete));

        expect(fs.readFile).toHaveBeenCalled();
        expect(mutationEngine.replaceInSection).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String), // section header
            expect.any(String), // task string to remove
            '', // replacement is an empty string
            'task-1'
        );
        console.log('Test finished: DELETE /api/plan-tasks - Delete Task');
    });
});

describe('Mutation API Routes: /api/promote-task', () => {
    beforeEach(() => {
        (mutationEngine.appendToSection as jest.Mock).mockClear();
        (mutationEngine.replaceInSection as jest.Mock).mockClear();
        (mutationEngine.validateMarkdownSchema as jest.Mock).mockClear();
        (fs.readFile as jest.Mock).mockClear();
    });

    it('should promote a task using the mutation engine', async () => {
        console.log('Running test: POST /api/promote-task');
        const promotionDetails = {
            task: { id: 'task-1', description: 'Task to promote' },
            destinationType: 'existing-loop',
            destinationId: 'loop-123.md',
        };
        const mockPlanContent = `- [ ] Task to promote\n\`id: task-1\``;
        (fs.readFile as jest.Mock).mockResolvedValue(mockPlanContent);
        
        await promoteTaskPOST(mockRequest(promotionDetails));

        // 1. Check schema validation
        expect(mutationEngine.validateMarkdownSchema).toHaveBeenCalledWith(
            expect.stringContaining('loop-123.md'),
            ['## 🔧 Tasks', '## 🧾 Execution Log']
        );

        // 2. Check task and log appending
        expect(mutationEngine.appendToSection).toHaveBeenCalledTimes(2);
        expect(mutationEngine.appendToSection).toHaveBeenCalledWith(
            expect.stringContaining('loop-123.md'),
            '## 🔧 Tasks',
            expect.stringContaining('Task to promote'),
            'task-1'
        );
        expect(mutationEngine.appendToSection).toHaveBeenCalledWith(
            expect.stringContaining('loop-123.md'),
            '## 🧾 Execution Log',
            expect.stringContaining('Task "Task to promote" promoted'),
            'task-1'
        );

        // 3. Check plan file update
        expect(mutationEngine.replaceInSection).toHaveBeenCalled();
        console.log('Test finished: POST /api/promote-task');
    });

    it('should throw an error if the target file schema is invalid', async () => {
        console.log('Running test: POST /api/promote-task - Invalid Schema');
        (mutationEngine.validateMarkdownSchema as jest.Mock).mockResolvedValueOnce({
            valid: false,
            errors: ['Missing ## 🔧 Tasks'],
        });
        const promotionDetails = {
            task: { id: 'task-1', description: 'Task to promote' },
            destinationType: 'existing-loop',
            destinationId: 'loop-123.md',
        };
        
        const response = await promoteTaskPOST(mockRequest(promotionDetails));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.message).toContain('is invalid: Missing ## 🔧 Tasks');
        console.log('Test finished: POST /api/promote-task - Invalid Schema');
    });
});

describe('Mutation API Routes: /api/chat', () => {
    beforeEach(() => {
        (mutationEngine.appendToSection as jest.Mock).mockClear();
    });

    it('should append a message to a task chat via mutation engine', async () => {
        console.log('Running test: POST /api/chat - Task Scope');
        const chatDetails = {
            scope: 'task',
            params: { id: 'loop-123' },
            message: { speaker: 'user', message: 'Test message' },
        };
        
        await chatPOST(mockRequest(chatDetails));

        expect(mutationEngine.appendToSection).toHaveBeenCalledWith(
            expect.stringContaining('loop-123.md'),
            '## 💬 Chat',
            expect.stringContaining('Test message'),
            'loop-123'
        );
        console.log('Test finished: POST /api/chat - Task Scope');
    });

    it('should append a message to a workstream chat file', async () => {
        console.log('Running test: POST /api/chat - Workstream Scope');
        const chatDetails = {
            scope: 'workstream',
            params: { name: 'roadmap' },
            message: { speaker: 'user', message: 'Hello workstream' },
        };

        (fs.appendFile as jest.Mock).mockClear(); // appendFile is used for non-task chats
        
        await chatPOST(mockRequest(chatDetails));

        expect(fs.appendFile).toHaveBeenCalledWith(
            expect.stringContaining('roadmap/chat.md'),
            expect.stringContaining('Hello workstream'),
            'utf-8'
        );
        console.log('Test finished: POST /api/chat - Workstream Scope');
    });
}); 