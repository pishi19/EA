import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from "lucide-react";
import { Task, taskService } from '../services/taskService';

interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
}

interface TaskChatPanelProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdate: (task: Task) => Promise<void>;
}

export default function TaskChatPanel({ task, isOpen, onClose, onTaskUpdate }: TaskChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Initialize chat with context about the task
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const contextMessage: ChatMessage = {
                id: 'context-1',
                content: `Chat started for task: "${task.description}"
                
Task Details:
• Status: ${task.status}
• Added by: ${task.added_by}  
• Source: ${task.source}
• Section: ${task.section}
${task.context ? `• Context: ${task.context}` : ''}
${task.promoted_to ? `• Promoted to: ${task.promoted_to}` : ''}

How can I help you with this task?`,
                sender: 'system',
                timestamp: new Date()
            };
            setMessages([contextMessage]);
        }
    }, [isOpen, task, messages.length]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            content: newMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsSending(true);

        try {
            // Create context for the chat API
            const chatContext = {
                taskId: task.id,
                taskDescription: task.description,
                taskStatus: task.status,
                taskAddedBy: task.added_by,
                taskSource: task.source,
                taskContext: task.context,
                taskSection: task.section,
                promotedTo: task.promoted_to
            };

            const data = await taskService.chatWithTask(
                newMessage,
                chatContext,
                messages.filter(m => m.sender !== 'system').slice(-5) // Last 5 messages for context
            );
            
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                content: data.content || "I'm here to help with your task. Could you please clarify what you need assistance with?",
                sender: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'assistant',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Task Chat
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground truncate">
                        {task.description}
                    </div>
                </DialogHeader>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-md bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.sender === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : message.sender === 'system'
                                        ? 'bg-gray-200 text-gray-700 text-sm'
                                        : 'bg-white border shadow-sm'
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className={`text-xs mt-1 ${
                                    message.sender === 'user' 
                                        ? 'text-blue-100' 
                                        : 'text-gray-500'
                                }`}>
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start">
                            <div className="bg-white border shadow-sm rounded-lg p-3 max-w-[80%]">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-pulse">Thinking...</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2 pt-4">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about this task, request changes, or get suggestions..."
                        className="flex-1 min-h-[60px] resize-none"
                        disabled={isSending}
                    />
                    <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="h-[60px] w-12"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 