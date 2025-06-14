"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Calendar, CheckSquare, RefreshCw, BookOpen, Target, ArrowUpCircle, MessageSquare, Plus, Checkbox } from "lucide-react";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Import custom hooks
import { useTasks } from './hooks/useTasks';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTaskMutations } from './hooks/useTaskMutations';
import { useBatchTaskOperations } from './hooks/useBatchTaskOperations';

// Import components
import TaskFilterControls from './components/TaskFilterControls';
import TaskChatPanel from './components/TaskChatPanel';
import TaskPromotionDialog from './components/TaskPromotionDialog';

// Component for displaying full roadmap content
function RoadmapDisplayPanel() {
    const [roadmapContent, setRoadmapContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/system-docs?file=roadmap.md');
                if (!response.ok) {
                    throw new Error(`Failed to fetch roadmap: ${response.statusText}`);
                }
                const data = await response.json();
                
                // Extract content from the API response structure
                const content = data.selectedFile?.rawContent || data.selectedFile?.content || '';
                setRoadmapContent(content);
            } catch (err) {
                console.error('Failed to fetch roadmap:', err);
                setError(err instanceof Error ? err.message : 'Failed to load roadmap');
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, []);

    const formatRoadmapContent = (content: string) => {
        if (!content) return [];
        
        return content
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line, index) => {
                const trimmedLine = line.trim();
                
                // Headers
                if (trimmedLine.startsWith('# ')) {
                    return (
                        <h1 key={index} className="text-2xl font-bold text-blue-800 mt-6 mb-3">
                            {trimmedLine.substring(2)}
                        </h1>
                    );
                }
                if (trimmedLine.startsWith('## ')) {
                    return (
                        <h2 key={index} className="text-xl font-semibold text-blue-700 mt-5 mb-2">
                            {trimmedLine.substring(3)}
                        </h2>
                    );
                }
                if (trimmedLine.startsWith('### ')) {
                    return (
                        <h3 key={index} className="text-lg font-medium text-blue-600 mt-4 mb-2">
                            {trimmedLine.substring(4)}
                        </h3>
                    );
                }
                
                // Status indicators with colors
                if (trimmedLine.includes('✅ COMPLETE')) {
                    return (
                        <div key={index} className="text-green-600 font-medium py-1">
                            {trimmedLine}
                        </div>
                    );
                }
                if (trimmedLine.includes('🔄 IN PROGRESS')) {
                    return (
                        <div key={index} className="text-blue-600 font-medium py-1">
                            {trimmedLine}
                        </div>
                    );
                }
                if (trimmedLine.includes('📋')) {
                    return (
                        <div key={index} className="text-amber-600 font-medium py-1">
                            {trimmedLine}
                        </div>
                    );
                }
                
                // Lists
                if (trimmedLine.match(/^[-*]\s/)) {
                    return (
                        <li key={index} className="ml-4 py-1 text-gray-700">
                            {trimmedLine.substring(2)}
                        </li>
                    );
                }
                
                // Code blocks
                if (trimmedLine.startsWith('```')) {
                    return (
                        <div key={index} className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                            {trimmedLine}
                        </div>
                    );
                }
                
                // Regular paragraphs
                return (
                    <p key={index} className="py-1 text-gray-700 leading-relaxed">
                        {trimmedLine}
                    </p>
                );
            });
    };

    const lineCount = roadmapContent.split('\n').length;

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                📋 Complete System Roadmap
                                <Badge variant="secondary" className="ml-2">
                                    {loading ? '...' : `${lineCount} lines`}
                                </Badge>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="animate-spin h-6 w-6 mr-2" />
                                Loading roadmap...
                            </div>
                        ) : error ? (
                            <div className="text-red-600 py-4">
                                Error: {error}
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto bg-white border rounded-lg p-4 space-y-2">
                                {formatRoadmapContent(roadmapContent)}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

// Simple Task Add Form Component
function TaskAddForm({ onAdd, disabled }: { onAdd: (description: string, context: string) => void; disabled: boolean }) {
    const [description, setDescription] = useState('');
    const [context, setContext] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            onAdd(description, context);
            setDescription('');
            setContext('');
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <Button 
                onClick={() => setIsOpen(true)} 
                variant="outline" 
                className="w-full"
                disabled={disabled}
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
            </Button>
        );
    }

    return (
        <Card>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            placeholder="Task description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Input
                            placeholder="Context (optional)..."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={disabled}>
                            Add
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// Inner component with hooks
function PlanningPageInner() {
    // Data and state management hooks
    const { 
        tasks, 
        loading: tasksLoading, 
        error: tasksError, 
        refetch: refetchTasks 
    } = useTasks();

    const {
        filters,
        filterOptions,
        filteredTasks,
        setFilter,
        clearFilters
    } = useTaskFilters(tasks);

    const {
        createTask,
        updateTask,
        deleteTask,
        promoteTask,
        loading: mutationLoading
    } = useTaskMutations(refetchTasks);

    const {
        batchMode,
        selectedTasks,
        toggleBatchMode,
        selectAll,
        selectNone,
        toggleTaskSelection,
        executeBatchOperation,
        isProcessing: batchProcessing
    } = useBatchTaskOperations(filteredTasks, updateTask, deleteTask);

    // UI state
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showTaskChat, setShowTaskChat] = useState(false);
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);

    // Loading state
    if (tasksLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
                    <p>Loading tasks...</p>
                    <Button onClick={refetchTasks} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Error state
    if (tasksError) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Error: {tasksError}</p>
                    <Button onClick={refetchTasks}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const userTasks = filteredTasks.filter((t: any) => t.section === 'User-Defined Tasks');
    const oraTasks = filteredTasks.filter((t: any) => t.section === 'Ora-Suggested Tasks');
    const totalCount = tasks.length;
    const filteredCount = filteredTasks.length;

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">📋 Task Planning</h1>
                <p className="text-lg text-muted-foreground">
                    Strategic task management and roadmap-driven planning
                </p>
            </div>

            {/* Roadmap Display */}
            <RoadmapDisplayPanel />

            {/* Task Filters */}
            <TaskFilterControls
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={setFilter}
                onClearFilters={clearFilters}
                totalCount={totalCount}
                filteredCount={filteredCount}
            />

            {/* Batch Controls */}
            {batchMode && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">
                                    {selectedTasks.size} of {filteredCount} selected
                                </span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={selectAll}>
                                        Select All
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={selectNone}>
                                        Select None
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    onClick={() => executeBatchOperation('complete')}
                                    disabled={batchProcessing || selectedTasks.size === 0}
                                >
                                    Mark Complete
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => executeBatchOperation('delete')}
                                    disabled={batchProcessing || selectedTasks.size === 0}
                                >
                                    Delete
                                </Button>
                                <Button size="sm" variant="outline" onClick={toggleBatchMode}>
                                    Exit Batch Mode
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Task Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User-Defined Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            User-Defined Tasks
                            <Badge variant="outline">{userTasks.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {userTasks.map((task: any) => (
                            <Card key={task.id} className={`transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {batchMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.has(task.id)}
                                                onChange={() => toggleTaskSelection(task.id)}
                                                className="mt-1"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className={`leading-snug ${task.status === 'done' ? 'line-through' : ''}`}>
                                                {task.description}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">{task.added_by}</Badge>
                                                <Badge variant="outline">{task.status}</Badge>
                                                {task.promoted_to && <Badge variant="default">Promoted</Badge>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {task.status !== 'done' && !task.promoted_to && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowPromotionDialog(true);
                                                    }}
                                                >
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowTaskChat(true);
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* Add Task Form */}
                        <TaskAddForm
                            onAdd={(description: string, context: string) => createTask({
                                description,
                                context,
                                added_by: 'user'
                            })}
                            disabled={mutationLoading}
                        />
                    </CardContent>
                </Card>

                {/* Ora-Suggested Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            Ora-Suggested Tasks
                            <Badge variant="outline">{oraTasks.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {oraTasks.map((task: any) => (
                            <Card key={task.id} className={`transition-opacity ${task.status === 'done' ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {batchMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.has(task.id)}
                                                onChange={() => toggleTaskSelection(task.id)}
                                                className="mt-1"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className={`leading-snug ${task.status === 'done' ? 'line-through' : ''}`}>
                                                {task.description}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">{task.added_by}</Badge>
                                                <Badge variant="outline">{task.status}</Badge>
                                                {task.promoted_to && <Badge variant="default">Promoted</Badge>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {task.status !== 'done' && !task.promoted_to && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowPromotionDialog(true);
                                                    }}
                                                >
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowTaskChat(true);
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button onClick={toggleBatchMode} variant="outline">
                        {batchMode ? 'Exit Batch Mode' : 'Batch Operations'}
                    </Button>
                    <Button onClick={refetchTasks} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredCount} of {totalCount} tasks
                </div>
            </div>

            {/* Dialogs */}
            {selectedTask && (
                <>
                    <TaskChatPanel
                        task={selectedTask}
                        isOpen={showTaskChat}
                        onClose={() => {
                            setShowTaskChat(false);
                            setSelectedTask(null);
                        }}
                        onTaskUpdate={updateTask}
                    />
                    <TaskPromotionDialog
                        task={selectedTask}
                        isOpen={showPromotionDialog}
                        onClose={() => {
                            setShowPromotionDialog(false);
                            setSelectedTask(null);
                        }}
                        onPromote={promoteTask}
                    />
                </>
            )}
        </div>
    );
}

// Main exported component
export default function Planning() {
    return <PlanningPageInner />;
} 