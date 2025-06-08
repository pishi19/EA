"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageSquare, Calendar, Tag } from 'lucide-react';
import ChatPane from './chat/ChatPane';

// --- Types ---
interface Loop {
    id: string;
    name: string;
    title?: string;
    phase?: string;
    workstream?: string;
    status?: string;
    score?: number;
    tags?: string[];
    created?: string;
    summary?: string;
    filePath?: string;
}

interface LoopCardProps {
    loop: Loop;
}

// --- Component ---
export default function LoopCard({ loop }: LoopCardProps) {
    const [chatHeight, setChatHeight] = useState(400);

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'planning': return 'bg-blue-100 text-blue-800';
            case 'active': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return 'text-gray-500';
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-lg font-semibold">
                            {loop.title || loop.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                                {loop.id}
                            </Badge>
                            {loop.phase && (
                                <Badge variant="secondary" className="text-xs">
                                    Phase {loop.phase}
                                </Badge>
                            )}
                            {loop.workstream && (
                                <Badge variant="outline" className="text-xs">
                                    {loop.workstream}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {loop.status && (
                            <Badge className={`text-xs ${getStatusColor(loop.status)}`}>
                                {loop.status}
                            </Badge>
                        )}
                        {loop.score && (
                            <div className={`text-sm font-medium ${getScoreColor(loop.score)}`}>
                                Score: {loop.score.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {loop.summary && (
                    <p className="text-sm text-muted-foreground">{loop.summary}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                    {loop.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                        </Badge>
                    ))}
                </div>

                {loop.created && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created: {new Date(loop.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                        })}
                    </div>
                )}

                {/* Chat Section */}
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
                                    contextType="loop"
                                    contextId={loop.id}
                                    filePath={loop.filePath}
                                    title={`💬 Chat - ${loop.name}`}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                <span>Resize chat panel:</span>
                                <div className="flex gap-1">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => setChatHeight(300)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Small
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => setChatHeight(400)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Medium
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => setChatHeight(600)}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Large
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
} 