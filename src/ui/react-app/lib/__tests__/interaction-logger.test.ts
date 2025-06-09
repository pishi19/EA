import { logInteraction, logChatInteraction, logTaskInteraction, logUIInteraction } from '../interaction-logger';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('Interaction Logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPath.resolve.mockImplementation((...paths) => paths.join('/'));
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);
        
        // Mock console.log to avoid test output noise
        jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('logs basic interaction', async () => {
        const result = await logInteraction(
            'task_completion',
            'Task completed successfully',
            'Task marked as done with score 0.85',
            'user',
            'ui'
        );

        expect(mockFs.mkdir).toHaveBeenCalled();
        expect(mockFs.writeFile).toHaveBeenCalled();
        expect(result).toMatch(/^interaction-/);
    });

    test('logs task creation interaction', async () => {
        const interaction = {
            type: 'task_creation' as InteractionType,
            taskId: 'new-task-456',
            data: { title: 'New Task', priority: 'high' }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('logs user feedback interaction', async () => {
        const interaction = {
            type: 'user_feedback' as InteractionType,
            taskId: 'feedback-task-789',
            data: { 
                feedback: 'Great work!', 
                rating: 5,
                timestamp: '2023-12-13T10:30:00.000Z'
            }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('logs chat message interaction', async () => {
        const interaction = {
            type: 'chat_message' as InteractionType,
            taskId: 'chat-task-101',
            data: { 
                message: 'Hello, how can I help?',
                role: 'assistant',
                contextId: 'loop-123'
            }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('logs task progress interaction', async () => {
        const interaction = {
            type: 'task_progress' as InteractionType,
            taskId: 'progress-task-202',
            data: { 
                progress: 0.75,
                status: 'in_progress',
                notes: 'Making good progress'
            }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('handles API errors gracefully', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        const interaction = {
            type: 'task_completion' as InteractionType,
            taskId: 'error-task-303',
            data: { error: true }
        };

        // Should not throw but handle error internally
        await expect(logInteraction(interaction)).resolves.not.toThrow();
        
        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('handles network errors gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const interaction = {
            type: 'task_creation' as InteractionType,
            taskId: 'network-error-task-404',
            data: { networkIssue: true }
        };

        // Should not throw but handle error internally
        await expect(logInteraction(interaction)).resolves.not.toThrow();
    });

    test('handles missing data gracefully', async () => {
        const interaction = {
            type: 'task_completion' as InteractionType,
            taskId: 'minimal-task-505'
            // No data property
        };

        await logInteraction(interaction as any);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('handles empty task ID', async () => {
        const interaction = {
            type: 'user_feedback' as InteractionType,
            taskId: '',
            data: { feedback: 'Empty task ID test' }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });

    test('handles complex data objects', async () => {
        const interaction = {
            type: 'task_creation' as InteractionType,
            taskId: 'complex-task-606',
            data: {
                title: 'Complex Task',
                metadata: {
                    priority: 'high',
                    tags: ['important', 'urgent'],
                    assignee: {
                        id: 'user-123',
                        name: 'John Doe'
                    }
                },
                timeline: {
                    created: '2023-12-13T10:00:00.000Z',
                    deadline: '2023-12-20T17:00:00.000Z'
                },
                dependencies: ['task-1', 'task-2'],
                customFields: {
                    estimatedHours: 8,
                    complexity: 'medium'
                }
            }
        };

        await logInteraction(interaction);

        expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(interaction)
        });
    });
}); 