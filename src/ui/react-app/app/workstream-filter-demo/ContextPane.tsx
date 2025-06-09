import React, { useState, useEffect, useRef } from 'react';
import { 
    FileText, 
    MessageSquare, 
    History, 
    ChevronDown, 
    ChevronUp,
    Calendar,
    Tag,
    Target,
    Users,
    Activity,
    ExternalLink,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle,
    Edit,
    Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Artefact {
    id: string;
    name: string;
    title: string;
    phase: string;
    workstream: string;
    program?: string;
    status: string;
    score: number;
    tags: string[];
    created: string;
    uuid: string;
    summary: string;
    filePath: string;
    origin: string;
    type?: string;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'workstream' | 'program' | 'project' | 'artefact';
    level: number;
    children: TreeNode[];
    artefact?: Artefact;
    count?: number;
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

interface ContextPaneProps {
    selectedNode?: TreeNode;
    selectedArtefact?: Artefact;
    className?: string;
    onArtefactUpdate?: (artefact: Artefact) => void;
}

export default function ContextPane({ 
    selectedNode, 
    selectedArtefact,
    className = "",
    onArtefactUpdate
}: ContextPaneProps) {
    const [chatExpanded, setChatExpanded] = useState(true);
    const [memoryExpanded, setMemoryExpanded] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [memoryTrace, setMemoryTrace] = useState<MemoryTraceEntry[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [chatError, setChatError] = useState<string | null>(null);
    const [currentArtefact, setCurrentArtefact] = useState<Artefact | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const streamingRef = useRef<AbortController | null>(null);

    // Available mutation actions
    const MUTATION_ACTIONS = [
        { id: 'status_complete', label: 'Mark as Complete', type: 'status_change', value: 'complete' },
        { id: 'status_progress', label: 'Mark as In Progress', type: 'status_change', value: 'in_progress' },
        { id: 'status_planning', label: 'Mark as Planning', type: 'status_change', value: 'planning' },
        { id: 'add_tag_urgent', label: 'Add "urgent" tag', type: 'add_tag', value: 'urgent' },
        { id: 'add_tag_review', label: 'Add "needs-review" tag', type: 'add_tag', value: 'needs-review' },
    ];

    // Initialize chat and memory trace when artefact changes
    useEffect(() => {
        if (selectedArtefact && selectedArtefact.id !== currentArtefact?.id) {
            setCurrentArtefact(selectedArtefact);
            loadChatHistory(selectedArtefact);
            loadMemoryTrace(selectedArtefact);
            setChatError(null);
        }
    }, [selectedArtefact, currentArtefact]);

    // Scroll to bottom when chat updates
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, streamingMessage]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const loadChatHistory = async (artefact: Artefact) => {
        try {
            // Initialize with welcome message
            const mockHistory: ChatMessage[] = [
                {
                    id: '1',
                    role: 'assistant',
                    content: `Hello! I'm here to help you with "${artefact.title}". You can ask me questions about this artefact, request status updates, or ask me to perform actions like changing the status or adding tags.`,
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    status: 'sent'
                }
            ];
            setChatHistory(mockHistory);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    };

    const loadMemoryTrace = async (artefact: Artefact) => {
        try {
            const response = await fetch(`/api/memory-trace?artefactId=${artefact.id}`);
            if (response.ok) {
                const data = await response.json();
                setMemoryTrace(data.trace || []);
            } else {
                // Fallback to mock data
                const entries: MemoryTraceEntry[] = [
                    {
                        id: '1',
                        timestamp: artefact.created,
                        type: 'creation',
                        content: `Artefact created from ${artefact.origin}`,
                        source: 'system',
                        metadata: { origin: artefact.origin, filePath: artefact.filePath }
                    },
                    {
                        id: '2',
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        type: 'chat',
                        content: 'Chat session initialized',
                        source: 'system'
                    }
                ];
                setMemoryTrace(entries);
            }
        } catch (error) {
            console.error('Failed to load memory trace:', error);
            // Use mock data as fallback
            const entries: MemoryTraceEntry[] = [
                {
                    id: '1',
                    timestamp: artefact.created,
                    type: 'creation',
                    content: `Artefact created from ${artefact.origin}`,
                    source: 'system',
                    metadata: { origin: artefact.origin, filePath: artefact.filePath }
                }
            ];
            setMemoryTrace(entries);
        }
    };

    const addMemoryTraceEntry = async (entry: Omit<MemoryTraceEntry, 'id' | 'timestamp'>) => {
        if (!currentArtefact) return;

        try {
            const response = await fetch('/api/memory-trace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artefactId: currentArtefact.id,
                    entry
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMemoryTrace(prev => [...prev, data.entry]);
            } else {
                // Fallback to local state update
                const newEntry: MemoryTraceEntry = {
                    ...entry,
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString()
                };
                setMemoryTrace(prev => [...prev, newEntry]);
            }
        } catch (error) {
            console.error('Failed to add memory trace entry:', error);
            // Fallback to local state update
            const newEntry: MemoryTraceEntry = {
                ...entry,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString()
            };
            setMemoryTrace(prev => [...prev, newEntry]);
        }
    };

    const simulateLLMStream = async (prompt: string, messageId: string): Promise<string> => {
        if (!currentArtefact) {
            throw new Error('No artefact selected');
        }

        try {
            // Call the real chat API
            const response = await fetch('/api/artefact-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artefactId: currentArtefact.id,
                    message: prompt,
                    context: { artefact: currentArtefact }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chat API');
            }

            const chatResponse = await response.json();
            
            if (chatResponse.error) {
                throw new Error(chatResponse.error);
            }

            // Simulate streaming the response
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                streamingRef.current = controller;

                let index = 0;
                const responseText = chatResponse.message;
                
                const streamInterval = setInterval(() => {
                    if (controller.signal.aborted) {
                        clearInterval(streamInterval);
                        reject(new Error('Stream aborted'));
                        return;
                    }

                    if (index < responseText.length) {
                        const chunk = responseText.slice(0, index + 1);
                        setStreamingMessage(chunk);
                        index++;
                    } else {
                        clearInterval(streamInterval);
                        setStreamingMessage('');
                        resolve(responseText);
                    }
                }, 20); // Simulate typing speed

                // Auto-complete after timeout
                setTimeout(() => {
                    if (!controller.signal.aborted) {
                        clearInterval(streamInterval);
                        setStreamingMessage('');
                        resolve(responseText);
                    }
                }, 3000);
            });

        } catch (error) {
            console.error('LLM API error:', error);
            // Fallback to local simulation
            return new Promise((resolve, reject) => {
                const controller = new AbortController();
                streamingRef.current = controller;

                let response = '';
                
                if (prompt.toLowerCase().includes('status')) {
                    response = `The current status of "${currentArtefact.title}" is **${currentArtefact.status}**. `;
                    if (currentArtefact.status === 'planning') {
                        response += 'Would you like me to move it to "in_progress" status? Just say "mark as in progress" and I\'ll update it for you.';
                    } else if (currentArtefact.status === 'in_progress') {
                        response += 'This artefact is actively being worked on. Would you like me to mark it as complete when finished?';
                    }
                } else if (prompt.toLowerCase().includes('complete') || prompt.toLowerCase().includes('done')) {
                    response = `I'll mark "${currentArtefact.title}" as complete for you.`;
                } else {
                    response = `I understand you're asking about "${currentArtefact.title}". This artefact is part of ${currentArtefact.phase} and has ${currentArtefact.tags.length} tags. I can help you update its status, add tags, or modify its summary. What would you like me to do?`;
                }

                let index = 0;
                const streamInterval = setInterval(() => {
                    if (controller.signal.aborted) {
                        clearInterval(streamInterval);
                        reject(new Error('Stream aborted'));
                        return;
                    }

                    if (index < response.length) {
                        const chunk = response.slice(0, index + 1);
                        setStreamingMessage(chunk);
                        index++;
                    } else {
                        clearInterval(streamInterval);
                        setStreamingMessage('');
                        resolve(response);
                    }
                }, 20);

                setTimeout(() => {
                    if (!controller.signal.aborted) {
                        clearInterval(streamInterval);
                        setStreamingMessage('');
                        resolve(response);
                    }
                }, 3000);
            });
        }
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || !currentArtefact || isStreaming) return;
        
        const userMessageId = `user-${Date.now()}`;
        const assistantMessageId = `assistant-${Date.now()}`;
        
        setChatError(null);
        
        // Add user message
        const userMessage: ChatMessage = {
            id: userMessageId,
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        setChatHistory(prev => [...prev, userMessage]);
        
        // Add memory trace for user message
        await addMemoryTraceEntry({
            type: 'chat',
            content: `User: ${chatInput.trim()}`,
            source: 'user'
        });

        const inputText = chatInput.trim();
        setChatInput('');
        setIsStreaming(true);

        try {
            // Check for mutation commands before API call
            const mutation = detectMutationIntent(inputText);
            
            // Call the API and get streaming response
            const response = await simulateLLMStream(inputText, assistantMessageId);
            
            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString(),
                status: 'sent',
                mutation: mutation
            };

            setChatHistory(prev => [...prev, assistantMessage]);
            
            // Add memory trace for assistant response
            await addMemoryTraceEntry({
                type: 'chat',
                content: `Assistant: ${response}`,
                source: 'assistant',
                metadata: mutation ? { mutation } : undefined
            });

            // Apply mutation if detected
            if (mutation && currentArtefact) {
                await applyMutation(mutation);
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
            if (streamingRef.current) {
                streamingRef.current = null;
            }
        }
    };

    const detectMutationIntent = (input: string): ChatMessage['mutation'] | undefined => {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('mark as complete') || lowerInput.includes('set to complete')) {
            return { type: 'status_change', action: 'Set status to complete', applied: false };
        }
        if (lowerInput.includes('mark as progress') || lowerInput.includes('in progress')) {
            return { type: 'status_change', action: 'Set status to in_progress', applied: false };
        }
        if (lowerInput.includes('add tag urgent') || lowerInput.includes('urgent tag')) {
            return { type: 'add_tag', action: 'Add "urgent" tag', applied: false };
        }
        if (lowerInput.includes('add tag review') || lowerInput.includes('needs review')) {
            return { type: 'add_tag', action: 'Add "needs-review" tag', applied: false };
        }
        
        return undefined;
    };

    const applyMutation = async (mutation: ChatMessage['mutation']) => {
        if (!mutation || !currentArtefact) return;

        try {
            let updatedArtefact = { ...currentArtefact };
            
            if (mutation.type === 'status_change') {
                const newStatus = mutation.action.includes('complete') ? 'complete' : 'in_progress';
                updatedArtefact.status = newStatus;
                
                await addMemoryTraceEntry({
                    type: 'mutation',
                    content: `Status changed from ${currentArtefact.status} to ${newStatus}`,
                    source: 'assistant',
                    metadata: { oldStatus: currentArtefact.status, newStatus }
                });
            } else if (mutation.type === 'add_tag') {
                const tagToAdd = mutation.action.includes('urgent') ? 'urgent' : 'needs-review';
                if (!updatedArtefact.tags.includes(tagToAdd)) {
                    updatedArtefact.tags = [...updatedArtefact.tags, tagToAdd];
                    
                    await addMemoryTraceEntry({
                        type: 'mutation',
                        content: `Added tag: ${tagToAdd}`,
                        source: 'assistant',
                        metadata: { tag: tagToAdd }
                    });
                }
            }

            // Update the mutation status
            mutation.applied = true;
            
            // Update chat history to show applied mutation
            setChatHistory(prev => prev.map(msg => 
                msg.mutation === mutation ? { ...msg, mutation: { ...mutation, applied: true } } : msg
            ));
            
            // Notify parent component of the update
            if (onArtefactUpdate) {
                onArtefactUpdate(updatedArtefact);
            }
            
            setCurrentArtefact(updatedArtefact);

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

    const handleQuickAction = async (actionId: string) => {
        const action = MUTATION_ACTIONS.find(a => a.id === actionId);
        if (!action || !currentArtefact) return;

        const prompt = `${action.label.toLowerCase()} for this artefact`;
        setChatInput(prompt);
        
        // Auto-send the quick action
        setTimeout(() => {
            handleSendChat();
        }, 100);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'complete': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getMemoryTraceIcon = (type: MemoryTraceEntry['type']) => {
        switch (type) {
            case 'creation': return '📝';
            case 'chat': return '💬';
            case 'mutation': return '⚡';
            case 'file_update': return '📄';
            default: return '📋';
        }
    };

    // If no node is selected, show empty state
    if (!selectedNode) {
        return (
            <Card className={`h-full ${className}`}>
                <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">Select a node to view details</p>
                        <p className="text-sm">
                            Click on any item in the roadmap tree to see its details, chat with the AI assistant, and view the memory trace.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`h-full ${className}`}>
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1 flex items-center space-x-2">
                            {selectedNode.type === 'workstream' && <Users className="h-5 w-5 text-blue-600" />}
                            {selectedNode.type === 'program' && <Target className="h-5 w-5 text-purple-600" />}
                            {selectedNode.type === 'project' && <Tag className="h-5 w-5 text-green-600" />}
                            {selectedNode.type === 'artefact' && <FileText className="h-5 w-5 text-gray-600" />}
                            <span className="truncate">{selectedNode.label}</span>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {selectedNode.type}
                        </Badge>
                    </div>
                    
                    {selectedArtefact && (
                        <Button variant="outline" size="sm" className="ml-2">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open File
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Artefact Details */}
                {currentArtefact && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="font-medium text-gray-700">Status</label>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(currentArtefact.status)}>
                                        {currentArtefact.status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Created</label>
                                <p className="mt-1 text-gray-600 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {currentArtefact.created}
                                </p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Workstream</label>
                                <p className="mt-1 text-gray-600">{currentArtefact.workstream}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Phase</label>
                                <p className="mt-1 text-gray-600">{currentArtefact.phase}</p>
                            </div>
                        </div>

                        {currentArtefact.tags && currentArtefact.tags.length > 0 && (
                            <div>
                                <label className="font-medium text-gray-700 text-sm">Tags</label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {currentArtefact.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentArtefact.summary && (
                            <div>
                                <label className="font-medium text-gray-700 text-sm">Summary</label>
                                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                    {currentArtefact.summary}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Node Summary for non-artefacts */}
                {!currentArtefact && selectedNode.count !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">Contains {selectedNode.count} artefacts</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            This {selectedNode.type} groups multiple artefacts and sub-components.
                        </p>
                    </div>
                )}

                {/* Quick Actions for artefacts */}
                {currentArtefact && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <label className="font-medium text-blue-900 text-sm">Quick Actions</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleQuickAction('status_complete')}
                                disabled={isStreaming || currentArtefact.status === 'complete'}
                                className="text-xs"
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Complete
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleQuickAction('add_tag_urgent')}
                                disabled={isStreaming || currentArtefact.tags.includes('urgent')}
                                className="text-xs"
                            >
                                <Hash className="h-3 w-3 mr-1" />
                                Add Urgent
                            </Button>
                        </div>
                    </div>
                )}

                {/* Chat Section - Only for artefacts */}
                {currentArtefact && (
                    <Collapsible open={chatExpanded} onOpenChange={setChatExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                <div className="flex items-center space-x-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>AI Assistant</span>
                                    <Badge variant="outline" className="text-xs">
                                        {chatHistory.length} messages
                                    </Badge>
                                    {isStreaming && <Loader2 className="h-3 w-3 animate-spin" />}
                                </div>
                                {chatExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                            <div className="border rounded-lg">
                                {/* Error Display */}
                                {chatError && (
                                    <Alert className="m-3 border-red-200 bg-red-50">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-red-800">
                                            {chatError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Chat History */}
                                <div className="max-h-64 overflow-y-auto p-3 space-y-3">
                                    {chatHistory.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No chat history yet. Start a conversation about this artefact.
                                        </p>
                                    ) : (
                                        <>
                                            {chatHistory.map((message) => (
                                                <div key={message.id} className={`text-sm ${
                                                    message.role === 'user' ? 'text-right' : 'text-left'
                                                }`}>
                                                    <div className={`inline-block p-3 rounded-lg max-w-[85%] ${
                                                        message.role === 'user' 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-gray-100 text-gray-900'
                                                    }`}>
                                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                                        
                                                        {/* Mutation Indicator */}
                                                        {message.mutation && (
                                                            <div className="mt-2 pt-2 border-t border-gray-300">
                                                                <div className="flex items-center space-x-1 text-xs">
                                                                    {message.mutation.applied ? (
                                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                                    ) : (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    )}
                                                                    <span className={message.mutation.applied ? 'text-green-600' : 'text-orange-600'}>
                                                                        {message.mutation.action}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                                        {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                        {message.status === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                                        <span>{formatTimestamp(message.timestamp)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Streaming Message */}
                                            {isStreaming && streamingMessage && (
                                                <div className="text-sm text-left">
                                                    <div className="inline-block p-3 rounded-lg max-w-[85%] bg-gray-100 text-gray-900">
                                                        <div className="whitespace-pre-wrap">{streamingMessage}</div>
                                                        <div className="mt-1">
                                                            <Loader2 className="h-3 w-3 animate-spin inline" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                
                                {/* Chat Input */}
                                <div className="border-t p-3">
                                    <div className="flex space-x-2">
                                        <Textarea
                                            placeholder={`Ask me about "${currentArtefact.title}" or request actions...`}
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            className="flex-1 min-h-[60px] resize-none"
                                            disabled={isStreaming}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendChat();
                                                }
                                            }}
                                        />
                                        <Button 
                                            onClick={handleSendChat}
                                            disabled={!chatInput.trim() || isStreaming}
                                            size="sm"
                                            className="self-end"
                                        >
                                            {isStreaming ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Try: "mark as complete", "add urgent tag", "what's the status?", or "update summary"
                                    </p>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Memory Trace Section - Only for artefacts */}
                {currentArtefact && (
                    <Collapsible open={memoryExpanded} onOpenChange={setMemoryExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                <div className="flex items-center space-x-2">
                                    <History className="h-4 w-4" />
                                    <span>Memory Trace</span>
                                    <Badge variant="outline" className="text-xs">
                                        {memoryTrace.length} entries
                                    </Badge>
                                </div>
                                {memoryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                            <div className="border rounded-lg p-3">
                                <div className="max-h-48 overflow-y-auto space-y-3">
                                    {memoryTrace.map((entry) => (
                                        <div key={entry.id} className="text-sm border-l-2 border-gray-200 pl-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="text-lg">{getMemoryTraceIcon(entry.type)}</span>
                                                    <span className="font-medium text-gray-700">
                                                        {entry.type.replace('_', ' ')}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {entry.source}
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {formatTimestamp(entry.timestamp)}
                                                </span>
                                            </div>
                                            <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded">
                                                {entry.content}
                                            </div>
                                            {entry.metadata && (
                                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                                    {JSON.stringify(entry.metadata, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
} 