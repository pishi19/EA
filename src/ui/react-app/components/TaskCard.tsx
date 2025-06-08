"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Calendar, User, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import ChatPane from './chat/ChatPane';

// --- Types ---
interface Task {
    id: string;
    description: string;
    added_by: 'user' | 'ora';
    status: 'pending' | 'done' | 'rejected' | 'promoted';
    source: string;
    context?: string;
    section: 'User-Defined Tasks' | 'Ora-Suggested Tasks';
    promoted_to?: string;
    created?: string;
    filePath?: string;
}

interface TaskCardProps {
    task: Task;
    onUpdate?: (task: Task) => void;
    showChat?: boolean;
}

// --- Component ---
export default function TaskCard({ task, onUpdate, showChat = true }: TaskCardProps) {
    const [chatHeight, setChatHeight] = useState(300);

    const handleToggleStatus = () => {
        if (onUpdate) {
            const newStatus = task.status === 'done' ? 'pending' : 'done';
            onUpdate({ ...task, status: newStatus });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
            case 'promoted': return <CheckCircle className="h-4 w-4 text-blue-600" />;
            default: return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'promoted': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card className={`w-full transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <Checkbox 
                            checked={task.status === 'done'} 
                            onCheckedChange={handleToggleStatus}
                            className="mt-1"
                        />
                        <div className="space-y-2 flex-1">
                            <CardTitle className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through' : ''}`}>
                                {task.description}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                    {task.id.slice(0, 8)}...
                                </Badge>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <Badge variant="secondary" className="text-xs">
                                        {task.added_by}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span className="text-xs">{task.source}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {task.context && (
                    <div className="text-xs text-muted-foreground">
                        <strong>Context:</strong> {task.context}
                    </div>
                )}

                {task.promoted_to && (
                    <div className="text-xs">
                        <Badge variant="default" className="text-xs">
                            Promoted to: {task.promoted_to}
                        </Badge>
                    </div>
                )}

                {task.created && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created: {new Date(task.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                        })}
                    </div>
                )}

                {/* Chat Section */}
                {showChat && (
                    <Accordion type="single" collapsible>
                        <AccordionItem value="chat">
                            <AccordionTrigger className="text-sm font-medium">
                                <div className="flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    💬 Chat
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="mt-4">
                                <div 
                                    className="border rounded-lg overflow-hidden"
                                    style={{ height: `${chatHeight}px` }}
                                >
                                    <ChatPane
                                        contextType="task"
                                        contextId={task.id}
                                        filePath={task.filePath}
                                        title={`💬 Chat - Task ${task.id.slice(0, 8)}`}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                    <span>Resize chat panel:</span>
                                    <div className="flex gap-1">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setChatHeight(200)}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Small
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setChatHeight(300)}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Medium
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => setChatHeight(400)}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Large
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
} 