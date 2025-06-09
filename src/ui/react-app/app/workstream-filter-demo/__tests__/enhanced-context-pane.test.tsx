import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContextPane from '../ContextPane';

// Mock fetch for API calls
global.fetch = jest.fn();

const mockArtefact = {
    id: 'test-artefact-1',
    name: 'Test Artefact',
    title: 'Enhanced Chat Test',
    phase: 'Phase 11',
    workstream: 'Ora',
    status: 'planning',
    score: 8.5,
    tags: ['enhancement', 'chat'],
    created: '2025-12-15',
    uuid: 'test-uuid-123',
    summary: 'Test artefact for enhanced chat functionality',
    filePath: 'runtime/loops/test-artefact-1.md',
    origin: 'ui-add',
    type: 'task'
};

const mockTreeNode = {
    id: 'artefact-test-1',
    label: 'Enhanced Chat Test',
    type: 'artefact' as const,
    level: 3,
    children: [],
    artefact: mockArtefact
};

describe('Enhanced ContextPane', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock memory trace API
        (fetch as jest.MockedFunction<typeof fetch>).mockImplementation((input: string | Request | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();
            const options = init;
            
            if (url.includes('/api/memory-trace')) {
                if (options?.method === 'POST') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            entry: {
                                id: 'test-entry',
                                timestamp: new Date().toISOString(),
                                ...JSON.parse((options.body as string) || '{}').entry
                            }
                        })
                    } as Response);
                } else {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            trace: [
                                {
                                    id: '1',
                                    timestamp: mockArtefact.created,
                                    type: 'creation',
                                    content: `Artefact created from ${mockArtefact.origin}`,
                                    source: 'system',
                                    metadata: { origin: mockArtefact.origin }
                                }
                            ]
                        })
                    } as Response);
                }
            }
            
            if (url.includes('/api/artefact-chat')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        message: "I'll help you with that artefact!",
                        mutation: {
                            type: 'status_change',
                            action: 'Set status to complete',
                            newValue: 'complete'
                        }
                    })
                } as Response);
            }
            
            return Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Not found' })
            } as Response);
        });
    });

    test('renders empty state when no node selected', () => {
        render(<ContextPane />);
        
        expect(screen.getByText('Select a node to view details')).toBeInTheDocument();
        expect(screen.getByText(/Click on any item in the roadmap tree/)).toBeInTheDocument();
    });

    test('loads and displays artefact details', async () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        expect(screen.getByText('Enhanced Chat Test')).toBeInTheDocument();
        expect(screen.getByText('planning')).toBeInTheDocument();
        expect(screen.getByText('Phase 11')).toBeInTheDocument();
        expect(screen.getByText('enhancement')).toBeInTheDocument();
        expect(screen.getByText('chat')).toBeInTheDocument();
    });

    test('loads memory trace from API', async () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        // Expand memory trace
        const memoryTraceButton = screen.getByRole('button', { name: /Memory Trace/ });
        fireEvent.click(memoryTraceButton);
        
        await waitFor(() => {
            expect(screen.getByText('Artefact created from ui-add')).toBeInTheDocument();
        });
        
        expect(fetch).toHaveBeenCalledWith('/api/memory-trace?artefactId=test-artefact-1');
    });

    test('displays chat interface with welcome message', () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        expect(screen.getByText(/Hello! I'm here to help you with/)).toBeInTheDocument();
        expect(screen.getByText(/AI Assistant/)).toBeInTheDocument();
    });

    test('sends chat message and receives response', async () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        const chatInput = screen.getByPlaceholderText(/Ask me about "Enhanced Chat Test"/);
        const sendButton = screen.getByRole('button', { name: /Send/ });
        
        fireEvent.change(chatInput, { target: { value: 'What is the status?' } });
        fireEvent.click(sendButton);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/artefact-chat', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('What is the status?')
            }));
        });
        
        await waitFor(() => {
            expect(screen.getByText("I'll help you with that artefact!")).toBeInTheDocument();
        });
    });

    test('handles mutation commands in chat', async () => {
        const onArtefactUpdate = jest.fn();
        
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact}
                onArtefactUpdate={onArtefactUpdate}
            />
        );
        
        const chatInput = screen.getByPlaceholderText(/Ask me about "Enhanced Chat Test"/);
        const sendButton = screen.getByRole('button', { name: /Send/ });
        
        fireEvent.change(chatInput, { target: { value: 'mark as complete' } });
        fireEvent.click(sendButton);
        
        await waitFor(() => {
            expect(onArtefactUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'complete'
                })
            );
        });
    });

    test('displays quick action buttons', () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        expect(screen.getByText('Mark Complete')).toBeInTheDocument();
        expect(screen.getByText('Add Urgent')).toBeInTheDocument();
    });

    test('executes quick actions', async () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        const markCompleteButton = screen.getByText('Mark Complete');
        fireEvent.click(markCompleteButton);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/artefact-chat', expect.objectContaining({
                method: 'POST'
            }));
        });
    });

    test('handles chat API errors gracefully', async () => {
        (fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(() => Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'API Error' })
        } as Response));
        
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        const chatInput = screen.getByPlaceholderText(/Ask me about "Enhanced Chat Test"/);
        const sendButton = screen.getByRole('button', { name: /Send/ });
        
        fireEvent.change(chatInput, { target: { value: 'test message' } });
        fireEvent.click(sendButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Failed to get response from chat API/)).toBeInTheDocument();
        });
    });

    test('displays streaming indicator during chat', async () => {
        render(
            <ContextPane 
                selectedNode={mockTreeNode} 
                selectedArtefact={mockArtefact} 
            />
        );
        
        const chatInput = screen.getByPlaceholderText(/Ask me about "Enhanced Chat Test"/);
        const sendButton = screen.getByRole('button', { name: /Send/ });
        
        fireEvent.change(chatInput, { target: { value: 'test message' } });
        fireEvent.click(sendButton);
        
        // Should show disabled state while processing
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
        });
    });
}); 