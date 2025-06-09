import React, { useState, useEffect } from 'react';
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
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';

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

interface ContextPaneProps {
    selectedNode?: TreeNode;
    selectedArtefact?: Artefact;
    className?: string;
}

export default function ContextPane({ 
    selectedNode, 
    selectedArtefact,
    className = "" 
}: ContextPaneProps) {
    const [chatExpanded, setChatExpanded] = useState(false);
    const [memoryExpanded, setMemoryExpanded] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([]);

    // Load chat history for selected artefact
    useEffect(() => {
        if (selectedArtefact) {
            // Simulate loading chat history - in real implementation this would fetch from API
            const mockHistory = [
                {
                    role: 'user' as const,
                    content: `What is the status of "${selectedArtefact.title}"?`,
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    role: 'assistant' as const,
                    content: `The artefact "${selectedArtefact.title}" is currently in ${selectedArtefact.status} status. It was created on ${selectedArtefact.created} and belongs to the ${selectedArtefact.workstream} workstream.`,
                    timestamp: new Date(Date.now() - 3500000).toISOString()
                }
            ];
            setChatHistory(mockHistory);
        }
    }, [selectedArtefact]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'complete': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSendChat = () => {
        if (!chatInput.trim() || !selectedArtefact) return;
        
        // Add user message
        const userMessage = {
            role: 'user' as const,
            content: chatInput,
            timestamp: new Date().toISOString()
        };
        
        // Simulate assistant response
        const assistantMessage = {
            role: 'assistant' as const,
            content: `I understand you're asking about "${selectedArtefact.title}". This artefact is part of ${selectedArtefact.program || selectedArtefact.phase} and has ${selectedArtefact.tags.length} associated tags. How can I help you further?`,
            timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, userMessage, assistantMessage]);
        setChatInput('');
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
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
                            Click on any item in the roadmap tree to see its details, chat history, and memory trace.
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
                {selectedArtefact && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="font-medium text-gray-700">Status</label>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(selectedArtefact.status)}>
                                        {selectedArtefact.status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Created</label>
                                <p className="mt-1 text-gray-600 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {selectedArtefact.created}
                                </p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Workstream</label>
                                <p className="mt-1 text-gray-600">{selectedArtefact.workstream}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-700">Phase</label>
                                <p className="mt-1 text-gray-600">{selectedArtefact.phase}</p>
                            </div>
                        </div>

                        {selectedArtefact.tags && selectedArtefact.tags.length > 0 && (
                            <div>
                                <label className="font-medium text-gray-700 text-sm">Tags</label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {selectedArtefact.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedArtefact.summary && (
                            <div>
                                <label className="font-medium text-gray-700 text-sm">Summary</label>
                                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                    {selectedArtefact.summary}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Node Summary for non-artefacts */}
                {!selectedArtefact && selectedNode.count !== undefined && (
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

                {/* Chat Section - Only for artefacts */}
                {selectedArtefact && (
                    <Collapsible open={chatExpanded} onOpenChange={setChatExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                <div className="flex items-center space-x-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Contextual Chat</span>
                                    <Badge variant="outline" className="text-xs">
                                        {chatHistory.length} messages
                                    </Badge>
                                </div>
                                {chatExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                            <div className="border rounded-lg">
                                {/* Chat History */}
                                <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                                    {chatHistory.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No chat history yet. Start a conversation about this artefact.
                                        </p>
                                    ) : (
                                        chatHistory.map((message, index) => (
                                            <div key={index} className={`text-sm ${
                                                message.role === 'user' ? 'text-right' : 'text-left'
                                            }`}>
                                                <div className={`inline-block p-2 rounded max-w-[80%] ${
                                                    message.role === 'user' 
                                                        ? 'bg-blue-100 text-blue-900' 
                                                        : 'bg-gray-100 text-gray-900'
                                                }`}>
                                                    {message.content}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatTimestamp(message.timestamp)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                {/* Chat Input */}
                                <div className="border-t p-3">
                                    <div className="flex space-x-2">
                                        <Textarea
                                            placeholder={`Ask about "${selectedArtefact.title}"...`}
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            className="flex-1 min-h-[60px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendChat();
                                                }
                                            }}
                                        />
                                        <Button 
                                            onClick={handleSendChat}
                                            disabled={!chatInput.trim()}
                                            size="sm"
                                        >
                                            Send
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Press Enter to send, Shift+Enter for new line
                                    </p>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Memory Trace Section - Only for artefacts */}
                {selectedArtefact && (
                    <Collapsible open={memoryExpanded} onOpenChange={setMemoryExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                                <div className="flex items-center space-x-2">
                                    <History className="h-4 w-4" />
                                    <span>Memory Trace</span>
                                </div>
                                {memoryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                            <div className="border rounded-lg p-3">
                                <div className="space-y-3">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-700 mb-1">Creation Event</div>
                                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs">
                                            📝 Artefact created from {selectedArtefact.origin} on {selectedArtefact.created}
                                        </div>
                                    </div>
                                    
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-700 mb-1">File Location</div>
                                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono">
                                            {selectedArtefact.filePath}
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <div className="font-medium text-gray-700 mb-1">UUID</div>
                                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono">
                                            {selectedArtefact.uuid}
                                        </div>
                                    </div>

                                    <div className="text-sm">
                                        <div className="font-medium text-gray-700 mb-1">Execution Log</div>
                                        <div className="text-gray-500 text-xs italic">
                                            Memory trace integration coming soon...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
} 