"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

// --- Types ---
interface ChatMessage {
    timestamp: string;
    speaker: 'user' | 'ora';
    message: string;
}

interface ChatPaneProps {
    scope: string;
    params: Record<string, string>;
    title: string;
}

// --- API Functions ---
const api = {
    getChat: async (scope: string, params: Record<string, string>) => {
        const query = new URLSearchParams({ scope, ...params }).toString();
        const res = await fetch(`/api/chat?${query}`);
        if (!res.ok) throw new Error('Failed to fetch chat');
        return res.json();
    },
    postMessage: async (scope: string, params: Record<string, string>, message: { speaker: 'user' | 'ora', message: string }) => {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope, params, message }),
        });
        if (!res.ok) throw new Error('Failed to post message');
        return res.json();
    }
};

// --- Main Component ---
export default function ChatPane({ scope, params, title }: ChatPaneProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const fetchChat = useCallback(async () => {
        setIsLoading(true);
        try {
            const chatHistory = await api.getChat(scope, params);
            setMessages(chatHistory);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [scope, params]);

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
        setMessages(prev => [...prev, { ...messageToSend, timestamp: new Date().toISOString() }]);

        try {
            const postedMessage = await api.postMessage(scope, params, messageToSend);
            // Optionally, update the message with the one from the server
            setMessages(prev => prev.map(m => m.timestamp.endsWith('Z') ? m : postedMessage));
            fetchChat(); // Refresh from source
        } catch (err) {
            setError('Failed to send message.');
            // Optionally, remove the optimistic message
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {isLoading && <p>Loading chat...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!isLoading && messages.length === 0 && <p className="text-muted-foreground text-center">No messages yet.</p>}
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : ''}`}>
                                {msg.speaker === 'ora' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/ora-avatar.png" />
                                        <AvatarFallback>O</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-3 py-2 text-sm ${msg.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p>{msg.message}</p>
                                    <time className="text-xs text-muted-foreground/80 block mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </time>
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