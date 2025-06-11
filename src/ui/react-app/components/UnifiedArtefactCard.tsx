"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, ChevronRight, MessageSquare, Calendar, Tag, Edit, Trash2, CheckCircle, XCircle, Clock, FileText, Target, List, MessageCircle, Database, Cog } from 'lucide-react';
import ChatPane from './chat/ChatPane';

// --- Types ---
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

interface ArtefactFullContent {
    frontmatter: Record<string, any>;
    sections: {
        objectives?: string;
        tasks?: string;
        executionLog?: string;
        memoryTrace?: string;
        systemContext?: string;
        [key: string]: string | undefined;
    };
    rawContent: string;
}

interface UnifiedArtefactCardProps {
    artefact: Artefact;
    isExpanded?: boolean;
    onToggleExpand?: (expanded: boolean) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onMutate?: (action: any) => void;
    showControls?: boolean;
    isPending?: boolean;
    isFailed?: boolean;
    className?: string;
}

// --- Component ---
export default function UnifiedArtefactCard({
    artefact,
    isExpanded = false,
    onToggleExpand,
    onEdit,
    onDelete,
    onMutate,
    showControls = true,
    isPending = false,
    isFailed = false,
    className = ''
}: UnifiedArtefactCardProps) {
    const [expanded, setExpanded] = useState(isExpanded);
    const [fullContent, setFullContent] = useState<ArtefactFullContent | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [contentError, setContentError] = useState<string | null>(null);
    const [chatHeight, setChatHeight] = useState(400);

    // Handle expansion toggle
    const handleToggleExpand = () => {
        const newExpanded = !expanded;
        setExpanded(newExpanded);
        onToggleExpand?.(newExpanded);
        
        // Load full content when expanding
        if (newExpanded && !fullContent) {
            loadFullContent();
        }
    };

    // Load full artefact content
    const loadFullContent = async () => {
        try {
            setLoadingContent(true);
            setContentError(null);
            
            // Mock API call - replace with actual API endpoint
            const response = await fetch(`/api/artefact-content?id=${artefact.id}`);
            
            if (!response.ok) {
                // Fallback: parse basic content from summary
                const sections = {
                    objectives: `# Objectives\n\nThis artefact focuses on ${artefact.title}.`,
                    tasks: `# Tasks\n\n- Implement core functionality\n- Test and validate\n- Document results`,
                    executionLog: `# Execution Log\n\n**Status**: ${artefact.status}\n**Created**: ${artefact.created}\n**Tags**: ${artefact.tags.join(', ')}`,
                    memoryTrace: `# Memory Trace\n\n- Artefact created: ${artefact.created}\n- Current status: ${artefact.status}`,
                    systemContext: `# System Context\n\n**Phase**: ${artefact.phase}\n**Workstream**: ${artefact.workstream}\n**Type**: ${artefact.type || 'task'}`
                };
                
                setFullContent({
                    frontmatter: {
                        title: artefact.title,
                        phase: artefact.phase,
                        workstream: artefact.workstream,
                        status: artefact.status,
                        tags: artefact.tags,
                        created: artefact.created,
                        uuid: artefact.uuid
                    },
                    sections,
                    rawContent: Object.values(sections).join('\n\n')
                });
            } else {
                const contentData = await response.json();
                setFullContent(contentData);
            }
        } catch (error) {
            console.error('Error loading full content:', error);
            setContentError('Failed to load full artefact content');
        } finally {
            setLoadingContent(false);
        }
    };

    // Status color helper
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'complete': 
            case 'completed': 
                return 'bg-green-100 text-green-800';
            case 'in_progress': 
            case 'active': 
                return 'bg-blue-100 text-blue-800';
            case 'planning': 
                return 'bg-yellow-100 text-yellow-800';
            case 'blocked': 
                return 'bg-red-100 text-red-800';
            default: 
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Score color helper
    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className={`w-full transition-all duration-200 ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleExpand}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            aria-label={expanded ? "Collapse artefact" : "Expand artefact"}
                        >
                            {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                        
                        <div className="space-y-2 flex-1">
                            <CardTitle className="text-lg font-semibold leading-tight">
                                {artefact.title}
                            </CardTitle>
                            {!expanded && (
                                <p className="text-xs text-muted-foreground">
                                    ▶️ Click to expand and access chat • Memory trace • Full content
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                    {artefact.id}
                                </Badge>
                                {artefact.phase && (
                                    <Badge variant="secondary" className="text-xs">
                                        Phase {artefact.phase}
                                    </Badge>
                                )}
                                {artefact.workstream && (
                                    <Badge variant="outline" className="text-xs">
                                        {artefact.workstream}
                                    </Badge>
                                )}
                                {artefact.type && (
                                    <Badge variant="outline" className="text-xs">
                                        {artefact.type}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Status and Score */}
                        <div className="flex flex-col items-end gap-1">
                            <Badge className={`text-xs ${getStatusColor(artefact.status)}`}>
                                {artefact.status}
                            </Badge>
                            {artefact.score > 0 && (
                                <div className={`text-xs font-medium ${getScoreColor(artefact.score)}`}>
                                    {artefact.score.toFixed(2)}
                                </div>
                            )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                            {/* Quick Chat Button - Always visible */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (!expanded) {
                                        handleToggleExpand();
                                    }
                                    // Scroll to chat section after a brief delay
                                    setTimeout(() => {
                                        const chatSection = document.querySelector('[data-chat-section="true"]');
                                        if (chatSection) {
                                            chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }, 300);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                title="Open chat for this artefact"
                            >
                                <MessageSquare className="h-3 w-3 text-blue-600" />
                            </Button>
                            
                            {showControls && !isPending && (
                                <>
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onEdit}
                                            className="h-8 w-8 p-0 hover:bg-blue-50"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onDelete}
                                            className="h-8 w-8 p-0 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0">
                {/* Summary - Always Visible */}
                <div className="space-y-3">
                    {artefact.summary && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {artefact.summary}
                        </p>
                    )}
                    
                    {/* Tags */}
                    {artefact.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {artefact.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Created date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created: {new Date(artefact.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                {/* Expanded Content */}
                <Collapsible open={expanded} onOpenChange={setExpanded}>
                    <CollapsibleContent className="mt-6 space-y-6">
                        {loadingContent && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-sm text-muted-foreground mt-2">Loading full content...</p>
                            </div>
                        )}

                        {contentError && (
                            <div className="space-y-6">
                                <div className="text-center py-8">
                                    <p className="text-sm text-red-600">{contentError}</p>
                                    <Button variant="outline" size="sm" onClick={loadFullContent} className="mt-2">
                                        Retry
                                    </Button>
                                </div>
                                
                                {/* Chat Section - Always available even if content fails */}
                                <div className="border-t pt-6" data-chat-section="true">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="h-5 w-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">💬 Chat & Memory</h3>
                                    </div>
                                    <div 
                                        className="border rounded-lg overflow-hidden bg-gray-50"
                                        style={{ height: `${chatHeight}px` }}
                                    >
                                        <ChatPane
                                            contextType="loop"
                                            contextId={artefact.id}
                                            filePath={artefact.filePath}
                                            title={`💬 Chat - ${artefact.name}`}
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
                                </div>
                            </div>
                        )}

                        {fullContent && !loadingContent && (
                            <div className="space-y-6">
                                {/* Full Artefact Sections */}
                                <Accordion type="multiple" defaultValue={["objectives", "tasks", "execution"]} className="w-full">
                                    {fullContent.sections.objectives && (
                                        <AccordionItem value="objectives">
                                            <AccordionTrigger className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4" />
                                                    Objectives
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: fullContent.sections.objectives.replace(/\n/g, '<br/>') }} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    {fullContent.sections.tasks && (
                                        <AccordionItem value="tasks">
                                            <AccordionTrigger className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <List className="h-4 w-4" />
                                                    Tasks
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: fullContent.sections.tasks.replace(/\n/g, '<br/>') }} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    {fullContent.sections.executionLog && (
                                        <AccordionItem value="execution">
                                            <AccordionTrigger className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    Execution Log
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: fullContent.sections.executionLog.replace(/\n/g, '<br/>') }} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    {fullContent.sections.memoryTrace && (
                                        <AccordionItem value="memory">
                                            <AccordionTrigger className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-4 w-4" />
                                                    Memory Trace
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: fullContent.sections.memoryTrace.replace(/\n/g, '<br/>') }} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    {fullContent.sections.systemContext && (
                                        <AccordionItem value="system">
                                            <AccordionTrigger className="text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Cog className="h-4 w-4" />
                                                    System Context
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: fullContent.sections.systemContext.replace(/\n/g, '<br/>') }} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>

                                {/* Chat Section - Always visible when expanded */}
                                <div className="border-t pt-6" data-chat-section="true">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="h-5 w-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">💬 Chat & Memory</h3>
                                    </div>
                                    <div 
                                        className="border rounded-lg overflow-hidden bg-gray-50"
                                        style={{ height: `${chatHeight}px` }}
                                    >
                                        <ChatPane
                                            contextType="loop"
                                            contextId={artefact.id}
                                            filePath={artefact.filePath}
                                            title={`💬 Chat - ${artefact.name}`}
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
                                </div>
                            </div>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
} 