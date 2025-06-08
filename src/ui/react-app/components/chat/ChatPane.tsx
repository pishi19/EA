"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, BookOpen, FileText } from 'lucide-react';

// --- Types ---
interface ChatMessage {
    timestamp: string;
    speaker: 'user' | 'ora';
    message: string;
}

interface ChatPaneProps {
    contextType: "loop" | "task" | "phase";
    contextId: string;
    filePath?: string;
    title?: string;
}

// --- API Functions ---
const api = {
    getChat: async (contextType: string, contextId: string, filePath?: string) => {
        const params = new URLSearchParams({ 
            contextType, 
            contextId,
            ...(filePath && { filePath })
        });
        const res = await fetch(`/api/contextual-chat?${params}`);
        if (!res.ok) throw new Error('Failed to fetch chat');
        return res.json();
    },
    postMessage: async (contextType: string, contextId: string, message: { speaker: 'user' | 'ora', message: string }, filePath?: string) => {
        const res = await fetch('/api/contextual-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contextType, 
                contextId, 
                message,
                ...(filePath && { filePath })
            }),
        });
        if (!res.ok) throw new Error('Failed to post message');
        return res.json();
    },
    logToSection: async (contextType: string, contextId: string, message: string, section: 'memory' | 'execution', filePath?: string) => {
        const res = await fetch('/api/contextual-chat/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contextType, 
                contextId, 
                message,
                section,
                ...(filePath && { filePath })
            }),
        });
        if (!res.ok) throw new Error('Failed to log message');
        return res.json();
    }
};

// --- Main Component ---
export default function ChatPane({ contextType, contextId, filePath, title }: ChatPaneProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const displayTitle = title || `💬 Chat - ${contextType} ${contextId}`;

    const fetchChat = useCallback(async () => {
        setIsLoading(true);
        try {
            const chatHistory = await api.getChat(contextType, contextId, filePath);
            // Ensure chatHistory is an array and sort messages chronologically (oldest first)
            const historyArray = Array.isArray(chatHistory) ? chatHistory : [];
            const sortedHistory = historyArray.sort((a: ChatMessage, b: ChatMessage) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setMessages(sortedHistory);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [contextType, contextId, filePath]);

    useEffect(() => {
        fetchChat();
    }, [fetchChat]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageToSend = { speaker: 'user' as 'user' | 'ora', message: newMessage.trim() };
        setNewMessage('');
        // Add message optimistically with proper sorting
        const optimisticMessage = { ...messageToSend, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, optimisticMessage].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));

        try {
            const postedMessage = await api.postMessage(contextType, contextId, messageToSend, filePath);
            // Optionally, update the message with the one from the server
            setMessages(prev => prev.map(m => m.timestamp.endsWith('Z') ? m : postedMessage));
            fetchChat(); // Refresh from source
        } catch (err) {
            setError('Failed to send message.');
            // Optionally, remove the optimistic message
        }
    };

    const handleLogToSection = async (message: string, section: 'memory' | 'execution') => {
        try {
            await api.logToSection(contextType, contextId, message, section, filePath);
            // Show success feedback (this could be enhanced with a toast library)
            const sectionName = section === 'memory' ? 'Memory Trace' : 'Execution Log';
            setError(`✅ Successfully added to ${sectionName}`);
            // Clear success message after 3 seconds
            setTimeout(() => setError(null), 3000);
        } catch (err) {
            setError(`Failed to log to ${section} section.`);
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{displayTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {isLoading && <p>Loading chat...</p>}
                        {error && (
                            <p className={error.startsWith('✅') ? 'text-green-600' : 'text-red-500'}>
                                {error}
                            </p>
                        )}
                        {!isLoading && messages.length === 0 && <p className="text-muted-foreground text-center">No messages yet.</p>}
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : ''}`}>
                                {msg.speaker === 'ora' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/ora-avatar.png" />
                                        <AvatarFallback>O</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-3 py-2 text-sm ${msg.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} max-w-[80%]`}>
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <time className="text-xs text-muted-foreground/80 block mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </time>
                                    {msg.speaker === 'ora' && (
                                        <div className="flex gap-2 mt-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleLogToSection(msg.message, 'memory')}
                                                className="text-xs h-6 px-2"
                                            >
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                Append to Memory Trace
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleLogToSection(msg.message, 'execution')}
                                                className="text-xs h-6 px-2"
                                            >
                                                <FileText className="h-3 w-3 mr-1" />
                                                Log to Execution Log
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                 {msg.speaker === 'user' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/user-avatar.png" />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
} 