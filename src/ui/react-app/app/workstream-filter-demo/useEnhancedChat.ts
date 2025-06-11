import { useState, useEffect, useRef, useCallback } from 'react';

interface Artefact {
    id: string;
    title: string;
    status: string;
    tags: string[];
    summary: string;
    phase: string;
    workstream: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    status?: 'sending' | 'sent' | 'error';
    mutation?: {
        type: 'status_change' | 'add_tag' | 'update_summary';
        action: string;
        applied: boolean;
    };
}

interface MemoryTraceEntry {
    id: string;
    timestamp: string;
    type: 'creation' | 'chat' | 'mutation' | 'file_update';
    content: string;
    source: 'user' | 'assistant' | 'system';
    metadata?: any;
}

export function useEnhancedChat(artefact: Artefact | null, onArtefactUpdate?: (artefact: Artefact) => void) {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [memoryTrace, setMemoryTrace] = useState<MemoryTraceEntry[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [chatError, setChatError] = useState<string | null>(null);
    
    const streamingControllerRef = useRef<AbortController | null>(null);

    // Load chat history and memory trace when artefact changes
    useEffect(() => {
        if (artefact) {
            loadChatHistory(artefact);
            loadMemoryTrace(artefact);
        } else {
            setChatHistory([]);
            setMemoryTrace([]);
        }
    }, [artefact?.id]);

    const loadChatHistory = async (artefact: Artefact) => {
        try {
            // Initialize with welcome message
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                role: 'assistant',
                content: `Hello! I'm here to help you with "${artefact.title}". You can ask me questions about this artefact, request status updates, or ask me to perform actions like changing the status or adding tags.`,
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                status: 'sent'
            };
            setChatHistory([welcomeMessage]);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            setChatError('Failed to load chat history');
        }
    };

    const loadMemoryTrace = async (artefact: Artefact) => {
        try {
            const response = await fetch(`/api/memory-trace?artefactId=${artefact.id}`);
            if (response.ok) {
                const data = await response.json();
                setMemoryTrace(data.trace || []);
            }
        } catch (error) {
            console.error('Failed to load memory trace:', error);
        }
    };

    const addMemoryTraceEntry = useCallback(async (entry: Omit<MemoryTraceEntry, 'id' | 'timestamp'>) => {
        if (!artefact) return;

        try {
            const response = await fetch('/api/memory-trace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artefactId: artefact.id,
                    entry
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMemoryTrace(prev => [...prev, data.entry]);
            }
        } catch (error) {
            console.error('Failed to add memory trace entry:', error);
        }
    }, [artefact]);

    const simulateStreamingResponse = (response: string): Promise<void> => {
        return new Promise((resolve) => {
            const controller = new AbortController();
            streamingControllerRef.current = controller;

            let index = 0;
            const streamInterval = setInterval(() => {
                if (controller.signal.aborted) {
                    clearInterval(streamInterval);
                    setStreamingMessage('');
                    resolve();
                    return;
                }

                if (index < response.length) {
                    const chunk = response.slice(0, index + 1);
                    setStreamingMessage(chunk);
                    index++;
                } else {
                    clearInterval(streamInterval);
                    setStreamingMessage('');
                    resolve();
                }
            }, 20); // Simulate typing speed

            // Auto-complete after timeout
            setTimeout(() => {
                if (!controller.signal.aborted) {
                    clearInterval(streamInterval);
                    setStreamingMessage('');
                    resolve();
                }
            }, 3000);
        });
    };

    const sendMessage = async (message: string) => {
        if (!message.trim() || !artefact || isStreaming) return;

        const userMessageId = `user-${Date.now()}`;
        const assistantMessageId = `assistant-${Date.now()}`;
        
        setChatError(null);
        
        // Add user message
        const userMessage: ChatMessage = {
            id: userMessageId,
            role: 'user',
            content: message.trim(),
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        setChatHistory(prev => [...prev, userMessage]);
        
        // Add memory trace for user message
        await addMemoryTraceEntry({
            type: 'chat',
            content: `User: ${message.trim()}`,
            source: 'user'
        });

        setIsStreaming(true);

        try {
            // Call chat API
            const response = await fetch('/api/artefact-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artefactId: artefact.id,
                    message: message.trim(),
                    context: { artefact }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chat API');
            }

            const chatResponse = await response.json();
            
            if (chatResponse.error) {
                throw new Error(chatResponse.error);
            }

            // Simulate streaming
            await simulateStreamingResponse(chatResponse.message);

            // Create mutation object if present
            const mutation = chatResponse.mutation ? {
                type: chatResponse.mutation.type as 'status_change' | 'add_tag' | 'update_summary',
                action: chatResponse.mutation.action,
                applied: false
            } : undefined;

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: chatResponse.message,
                timestamp: new Date().toISOString(),
                status: 'sent',
                mutation
            };

            setChatHistory(prev => [...prev, assistantMessage]);
            
            // Add memory trace for assistant response
            await addMemoryTraceEntry({
                type: 'chat',
                content: `Assistant: ${chatResponse.message}`,
                source: 'assistant',
                metadata: mutation ? { mutation } : undefined
            });

            // Apply mutation if detected
            if (mutation && chatResponse.mutation) {
                await applyMutation(mutation, chatResponse.mutation.newValue);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setChatError(error instanceof Error ? error.message : 'Failed to get response');
            
            // Update message status to error
            setChatHistory(prev => prev.map(msg => 
                msg.id === userMessageId ? { ...msg, status: 'error' as const } : msg
            ));
        } finally {
            setIsStreaming(false);
            setStreamingMessage('');
            if (streamingControllerRef.current) {
                streamingControllerRef.current = null;
            }
        }
    };

    const applyMutation = async (mutation: ChatMessage['mutation'], newValue: string) => {
        if (!mutation || !artefact) return;

        try {
            let updatedArtefact = { ...artefact };
            
            if (mutation.type === 'status_change') {
                updatedArtefact.status = newValue;
                
                await addMemoryTraceEntry({
                    type: 'mutation',
                    content: `Status changed from ${artefact.status} to ${newValue}`,
                    source: 'assistant',
                    metadata: { oldStatus: artefact.status, newStatus: newValue }
                });
            } else if (mutation.type === 'add_tag') {
                if (!updatedArtefact.tags.includes(newValue)) {
                    updatedArtefact.tags = [...updatedArtefact.tags, newValue];
                    
                    await addMemoryTraceEntry({
                        type: 'mutation',
                        content: `Added tag: ${newValue}`,
                        source: 'assistant',
                        metadata: { tag: newValue }
                    });
                }
            }

            // Update the mutation status
            mutation.applied = true;
            
            // Update chat history to reflect applied mutation
            setChatHistory(prev => prev.map(msg => 
                msg.mutation === mutation ? { ...msg, mutation: { ...mutation, applied: true } } : msg
            ));
            
            // Notify parent component of the update
            if (onArtefactUpdate) {
                onArtefactUpdate(updatedArtefact);
            }

        } catch (error) {
            console.error('Failed to apply mutation:', error);
            await addMemoryTraceEntry({
                type: 'mutation',
                content: `Failed to apply mutation: ${mutation.action}`,
                source: 'system',
                metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }
    };

    const getQuickActions = () => [
        { 
            id: 'status_complete', 
            label: 'Mark Complete', 
            disabled: !artefact || artefact.status === 'complete',
            prompt: 'mark as complete'
        },
        { 
            id: 'add_urgent', 
            label: 'Add Urgent', 
            disabled: !artefact || artefact.tags.includes('urgent'),
            prompt: 'add urgent tag'
        },
        { 
            id: 'status_progress', 
            label: 'In Progress', 
            disabled: !artefact || artefact.status === 'in_progress',
            prompt: 'mark as in progress'
        },
        { 
            id: 'add_review', 
            label: 'Needs Review', 
            disabled: !artefact || artefact.tags.includes('needs-review'),
            prompt: 'add needs review tag'
        }
    ];

    const executeQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    return {
        chatHistory,
        memoryTrace,
        isStreaming,
        streamingMessage,
        chatError,
        sendMessage,
        getQuickActions,
        executeQuickAction,
        addMemoryTraceEntry
    };
} 