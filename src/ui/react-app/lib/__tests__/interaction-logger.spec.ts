import { 
    logInteraction, 
    logChatInteraction, 
    logTaskInteraction, 
    logUIInteraction,
    InteractionContext 
} from '../interaction-logger';
import fs from 'fs/promises';

// Mock filesystem operations
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('interaction-logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);
    });

    test('logs basic interaction correctly', async () => {
        const uuid = await logInteraction(
            'test-interaction',
            'Test message',
            'Test outcome',
            'user',
            'ui',
            { contextType: 'phase', contextId: 'phase-11' }
        );

        expect(uuid).toBeDefined();
        expect(uuid).toMatch(/^interaction-\d+-[a-f0-9]{8}$/);
        expect(mockFs.mkdir).toHaveBeenCalled();
        expect(mockFs.writeFile).toHaveBeenCalled();
        
        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('Test message');
        expect(content).toContain('Test outcome');
        expect(content).toContain('actor: user');
        expect(content).toContain('source: ui');
    });

    test('logs chat interaction using convenience function', async () => {
        const uuid = await logChatInteraction(
            'Hello, how can I help?',
            'user',
            'phase',
            'phase-11',
            '/path/to/chat.md'
        );

        expect(uuid).toBeDefined();
        expect(mockFs.writeFile).toHaveBeenCalled();
        
        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('Chat message in phase phase-11');
        expect(content).toContain('Hello, how can I help?');
        expect(content).toContain('actor: user');
        expect(content).toContain('source: chat');
    });

    test('logs task interaction using convenience function', async () => {
        const uuid = await logTaskInteraction(
            'create',
            'Create new documentation page',
            'user',
            'Task created successfully',
            'task-123'
        );

        expect(uuid).toBeDefined();
        expect(mockFs.writeFile).toHaveBeenCalled();
        
        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('Task create');
        expect(content).toContain('Create new documentation page');
        expect(content).toContain('Task created successfully');
        expect(content).toContain('actor: user');
        expect(content).toContain('source: ui');
    });

    test('logs UI interaction using convenience function', async () => {
        const uuid = await logUIInteraction(
            'button-click',
            'User clicked download button',
            'File downloaded successfully',
            'system-docs'
        );

        expect(uuid).toBeDefined();
        expect(mockFs.writeFile).toHaveBeenCalled();
        
        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('UI button-click');
        expect(content).toContain('User clicked download button');
        expect(content).toContain('File downloaded successfully');
        expect(content).toContain('actor: user');
        expect(content).toContain('source: ui');
    });

    test('handles filesystem error gracefully', async () => {
        mockFs.writeFile.mockRejectedValue(new Error('Filesystem error'));

        await expect(logInteraction(
            'test-interaction',
            'Test message',
            'Test outcome',
            'user',
            'ui'
        )).rejects.toThrow('Filesystem error');
    });

    test('derives context and tags correctly for different interaction types', async () => {
        await logInteraction(
            'loop-mutation',
            'Updated loop status',
            'Status changed to active',
            'ora',
            'api',
            { contextType: 'loop', contextId: 'loop-456', action: 'status-update' }
        );

        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('context: loop-456');
        expect(content).toContain('loop, loop-interaction, loop-mutation, status-update, ora-action');
    });

    test('handles long messages by truncating in convenience functions', async () => {
        const longMessage = 'A'.repeat(200);
        
        await logChatInteraction(
            longMessage,
            'user',
            'phase',
            'phase-11'
        );

        const writeCall = mockFs.writeFile.mock.calls[0];
        const content = writeCall[1] as string;
        expect(content).toContain('Chat message in phase phase-11: "' + 'A'.repeat(100) + '...');
    });
}); 