"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Map, Plus, CheckSquare, RefreshCw, Book, FileText } from "lucide-react";
import { InlineTaskEditor } from '@/components/inline-task-editor';
import { BatchTaskControls, SelectableTaskCard } from '@/components/batch-task-controls';
import UnifiedArtefactCard from '@/components/UnifiedArtefactCard';

// Import tree navigation components
import TreeNavigation from './TreeNavigation';
import ContextPane from './ContextPane';
import useTreeState from './useTreeState';
import useRoadmapHierarchy from './useRoadmapHierarchy';

// Import custom hooks
import { useArtefacts } from './hooks/useArtefacts';
import { useArtefactFilters } from './hooks/useArtefactFilters';
import { useArtefactMutations } from './hooks/useArtefactMutations';
import { useBatchOperations } from './hooks/useBatchOperations';
import { FilterControls } from './components/FilterControls';
import { artefactService } from './services/artefactService';

// Import workstream context
import { WorkstreamProvider } from '@/lib/workstream-context';

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
                
                // Extract the raw content from the API response
                const content = data.selectedFile?.rawContent || data.selectedFile?.content || '';
                setRoadmapContent(content);
                setError(null);
            } catch (err) {
                console.error('Error fetching roadmap:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, []);

    // Format roadmap content for display
    const formatRoadmapContent = (content: string) => {
        if (!content) return '';
        
        // Split into lines and process
        const lines = content.split('\n');
        const formattedLines = lines.map((line, index) => {
            // Headers
            if (line.startsWith('# ')) {
                return `<h1 class="text-2xl font-bold text-blue-800 mb-4 mt-6">${line.substring(2).trim()}</h1>`;
            } else if (line.startsWith('## ')) {
                return `<h2 class="text-xl font-semibold text-blue-700 mb-3 mt-5">${line.substring(3).trim()}</h2>`;
            } else if (line.startsWith('### ')) {
                return `<h3 class="text-lg font-medium text-blue-600 mb-2 mt-4">${line.substring(4).trim()}</h3>`;
            } else if (line.startsWith('#### ')) {
                return `<h4 class="text-base font-medium text-gray-700 mb-2 mt-3">${line.substring(5).trim()}</h4>`;
            }
            // Lists
            else if (line.match(/^\s*[-*]\s+/)) {
                const indent = (line.match(/^\s*/)?.[0].length || 0) / 2;
                const content = line.replace(/^\s*[-*]\s+/, '').trim();
                return `<div class="ml-${Math.min(indent * 4, 16)} mb-1 text-gray-700">• ${content}</div>`;
            }
            // Status indicators
            else if (line.includes('✅ COMPLETE')) {
                return `<div class="text-green-600 font-medium mb-1">${line.trim()}</div>`;
            } else if (line.includes('🔄 IN PROGRESS')) {
                return `<div class="text-blue-600 font-medium mb-1">${line.trim()}</div>`;
            } else if (line.includes('📋 Planning')) {
                return `<div class="text-amber-600 font-medium mb-1">${line.trim()}</div>`;
            }
            // Bold text
            else if (line.includes('**')) {
                const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
                return `<div class="mb-1 text-gray-700">${formatted.trim()}</div>`;
            }
            // Code blocks
            else if (line.trim().startsWith('```')) {
                return `<div class="bg-gray-100 p-2 rounded text-sm font-mono mb-1">${line.trim()}</div>`;
            }
            // Empty lines
            else if (line.trim() === '') {
                return '<div class="mb-2"></div>';
            }
            // Regular text
            else if (line.trim()) {
                return `<div class="mb-1 text-gray-700">${line.trim()}</div>`;
            }
            return '';
        });

        return formattedLines.filter(line => line).join('');
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 animate-pulse" />
                        Loading Roadmap...
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <FileText className="h-5 w-5" />
                        Roadmap Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600">Failed to load roadmap: {error}</p>
                </CardContent>
            </Card>
        );
    }

    const lineCount = roadmapContent.split('\n').length;

    return (
        <Card>
            <CardHeader>
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                            <CardTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5" />
                                📋 Complete System Roadmap
                                <Badge variant="outline" className="ml-2">
                                    {lineCount} lines
                                </Badge>
                            </CardTitle>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-4">
                            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border">
                                <div 
                                    className="prose prose-sm max-w-none leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: formatRoadmapContent(roadmapContent) 
                                    }}
                                />
                            </div>
                            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                                <span>Source: runtime/docs/roadmap.md</span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        window.open('/system-docs', '_blank');
                                    }}
                                >
                                    View Full Docs
                                </Button>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </CardHeader>
        </Card>
    );
}

function WorkstreamsInner() {
    // Core data management
    const {
        artefacts,
        optimisticArtefacts,
        loading: artefactsLoading,
        error: artefactsError,
        refetchArtefacts,
        updateOptimisticArtefacts
    } = useArtefacts();

    // Filtering logic
    const {
        filters,
        filteredArtefacts,
        filterOptions,
        updateFilter,
        clearAllFilters,
        getStatusColor
    } = useArtefactFilters(optimisticArtefacts);

    // Mutation operations
    const {
        mutationState,
        createArtefact,
        updateArtefact,
        deleteArtefact,
        clearMutationError
    } = useArtefactMutations(optimisticArtefacts, updateOptimisticArtefacts, refetchArtefacts);

    // Batch operations
    const {
        batchState,
        toggleBatchMode,
        selectTask,
        selectAll,
        selectNone,
        batchEdit,
        batchDelete,
        clearBatchError
    } = useBatchOperations(optimisticArtefacts, updateOptimisticArtefacts, refetchArtefacts);

    // UI State
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [addingTask, setAddingTask] = useState<boolean>(false);
    const [expandedArtefacts, setExpandedArtefacts] = useState<Set<string>>(new Set());

    // Tree navigation and roadmap
    const treeState = useTreeState();
    const roadmapHierarchy = useRoadmapHierarchy();

    // Sync tree navigation with filter selections
    useEffect(() => {
        treeState.syncWithFilters(filters.workstream, filters.program, filters.project);
    }, [filters.workstream, filters.program, filters.project]);

    // Event handlers
    const handleAddTask = () => {
        setAddingTask(true);
        setEditingTask(null);
        clearMutationError();
    };

    const handleEditTask = (artefact: any) => {
        setEditingTask(artefact);
        setAddingTask(false);
        clearMutationError();
    };

    const handleDeleteTask = async (artefact: any) => {
        if (window.confirm(`Are you sure you want to delete "${artefact.title}"?`)) {
            try {
                await deleteArtefact(artefact.id);
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const handleSaveTask = async (taskData: any) => {
        try {
            if (editingTask) {
                await updateArtefact(editingTask.id, taskData);
            } else {
                await createArtefact(taskData);
            }
            
            setEditingTask(null);
            setAddingTask(false);
            clearMutationError();
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const handleCancelMutation = () => {
        setEditingTask(null);
        setAddingTask(false);
        clearMutationError();
    };

    const handleTreeNodeSelect = (node: any, artefact?: any) => {
        treeState.selectNode(node, artefact);
        
        // Update filter state based on node type
        if (node.type === 'workstream') {
            updateFilter('workstream', node.label);
        } else if (node.type === 'program') {
            updateFilter('program', node.id.replace('prog-', ''));
        } else if (node.type === 'project') {
            updateFilter('project', node.id.replace('proj-', ''));
        }
    };

    const handleToggleArtefactExpand = (artefactId: string, expanded: boolean) => {
        setExpandedArtefacts(prev => {
            const newSet = new Set(prev);
            if (expanded) {
                newSet.add(artefactId);
            } else {
                newSet.delete(artefactId);
            }
            return newSet;
        });
    };

    const handleExpandAll = () => {
        setExpandedArtefacts(new Set(filteredArtefacts.map(a => a.id)));
    };

    const handleCollapseAll = () => {
        setExpandedArtefacts(new Set());
    };

    const handleTaskSelectionChange = (taskId: string, selected: boolean) => {
        selectTask(taskId, selected);
    };

    const handleSelectAll = () => {
        selectAll(filteredArtefacts);
    };

    const handleSelectNone = () => {
        selectNone();
    };

    const handleBatchEdit = async (tasks: any[]) => {
        const updateData = { status: 'in_progress' }; // Example update
        try {
            await batchEdit(tasks, updateData);
        } catch (error) {
            console.error('Batch edit failed:', error);
        }
    };

    const handleBatchDelete = async (tasks: any[]) => {
        if (window.confirm(`Delete ${tasks.length} selected artefacts?`)) {
            try {
                await batchDelete(tasks);
            } catch (error) {
                console.error('Batch delete failed:', error);
            }
        }
    };

    // Loading state
    if (artefactsLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
                    <p>Loading artefacts...</p>
                    <Button onClick={refetchArtefacts} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Error state
    if (artefactsError) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Error: {artefactsError}</p>
                    <Button onClick={refetchArtefacts}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">🏗️ Workstreams</h1>
                <p className="text-lg text-muted-foreground">
                    Hierarchical filtering and task management across workstreams
                </p>
            </div>

            {/* Roadmap Display Panel */}
            <RoadmapDisplayPanel />

            {/* Roadmap Tree Navigation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        Roadmap Navigation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TreeNavigation 
                        artefacts={optimisticArtefacts}
                        roadmapHierarchy={roadmapHierarchy.hierarchy}
                        onNodeSelect={handleTreeNodeSelect}
                        validateArtefactAlignment={roadmapHierarchy.validateArtefactAlignment}
                        workstream={filters.workstream}
                    />
                </CardContent>
            </Card>

            {/* Error Messages */}
            {mutationState.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-red-800">{mutationState.error}</p>
                    <Button variant="outline" onClick={clearMutationError} className="mt-2">
                        Dismiss
                    </Button>
                </div>
            )}

            {batchState.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-red-800">{batchState.error}</p>
                    <Button variant="outline" onClick={clearBatchError} className="mt-2">
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Filter Controls */}
            <FilterControls
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={updateFilter}
                onClearFilters={clearAllFilters}
                totalCount={optimisticArtefacts.length}
                filteredCount={filteredArtefacts.length}
                roadmapLoading={roadmapHierarchy.loading}
                roadmapError={!!roadmapHierarchy.error}
            />

            {/* Two-column Layout: Artefacts + Context Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Artefacts List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>📋 Tasks & Artefacts</CardTitle>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleBatchMode}
                                >
                                    <CheckSquare className="h-4 w-4 mr-1" />
                                    {batchState.batchMode ? 'Exit Batch' : 'Batch Mode'}
                                </Button>
                                <Button onClick={handleAddTask} disabled={mutationState.loading}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Task
                                </Button>
                                <Button variant="outline" onClick={handleExpandAll}>
                                    Expand All
                                </Button>
                                <Button variant="outline" onClick={handleCollapseAll}>
                                    Collapse All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Batch Controls */}
                            {batchState.batchMode && (
                                <div className="mb-6">
                                    <BatchTaskControls
                                        tasks={filteredArtefacts.map(a => ({
                                            id: a.id,
                                            title: a.title,
                                            description: a.summary,
                                            status: a.status as any,
                                            phase: a.phase,
                                            workstream: a.workstream,
                                            tags: a.tags,
                                            uuid: a.uuid
                                        }))}
                                        selectedTasks={batchState.selectedTasks}
                                        onTaskSelectionChange={handleTaskSelectionChange}
                                        onSelectAll={handleSelectAll}
                                        onSelectNone={handleSelectNone}
                                        onBatchEdit={handleBatchEdit}
                                        onBatchDelete={handleBatchDelete}
                                        onBatchAdd={handleAddTask}
                                        disabled={batchState.loading}
                                    />
                                </div>
                            )}

                            {/* Inline Task Editor */}
                            {(editingTask || addingTask) && (
                                <div className="mb-6">
                                    <InlineTaskEditor
                                        task={editingTask ? {
                                            id: editingTask.id,
                                            title: editingTask.title,
                                            description: editingTask.summary,
                                            status: editingTask.status as any,
                                            phase: editingTask.phase,
                                            workstream: editingTask.workstream,
                                            tags: editingTask.tags,
                                            uuid: editingTask.uuid
                                        } : undefined}
                                        mode={editingTask ? 'edit' : 'add'}
                                        onSave={handleSaveTask}
                                        onCancel={handleCancelMutation}
                                        isLoading={mutationState.loading}
                                        error={mutationState.error}
                                    />
                                </div>
                            )}

                            {/* Artefacts List */}
                            {filteredArtefacts.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No artefacts match the current hierarchical filters.</p>
                                    <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                                        Clear All Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredArtefacts.map((artefact) => {
                                        const isPending = mutationState.pendingMutations.has(artefact.id);
                                        const isFailed = mutationState.failedMutations.has(artefact.id);
                                        const isExpanded = expandedArtefacts.has(artefact.id);
                                        const isSelected = batchState.selectedTasks.has(artefact.id);

                                        if (batchState.batchMode) {
                                            return (
                                                <SelectableTaskCard
                                                    key={artefact.id}
                                                    task={{
                                                        id: artefact.id,
                                                        title: artefact.title,
                                                        description: artefact.summary,
                                                        status: artefact.status as any,
                                                        phase: artefact.phase,
                                                        workstream: artefact.workstream,
                                                        tags: artefact.tags,
                                                        uuid: artefact.uuid
                                                    }}
                                                    selected={isSelected}
                                                    onSelectionChange={(taskId: string, selected: boolean) => handleTaskSelectionChange(taskId, selected)}
                                                />
                                            );
                                        }

                                        return (
                                            <UnifiedArtefactCard
                                                key={artefact.id}
                                                artefact={artefact}
                                                isExpanded={isExpanded}
                                                isPending={isPending}
                                                isFailed={isFailed}
                                                onToggleExpand={(expanded) => handleToggleArtefactExpand(artefact.id, expanded)}
                                                onEdit={() => handleEditTask(artefact)}
                                                onDelete={() => handleDeleteTask(artefact)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Context Pane */}
                <div className="lg:col-span-1">
                    <ContextPane 
                        selectedNode={treeState.selectedNode || undefined}
                        selectedArtefact={treeState.selectedArtefact || undefined}
                        filteredArtefacts={filteredArtefacts}
                        onArtefactUpdate={(updatedArtefact) => {
                            // Update single artefact in the optimistic state
                            updateOptimisticArtefacts(optimisticArtefacts.map(a => 
                                a.id === updatedArtefact.id ? updatedArtefact : a
                            ));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Workstreams() {
    return (
        <WorkstreamProvider>
            <WorkstreamsInner />
        </WorkstreamProvider>
    );
} 