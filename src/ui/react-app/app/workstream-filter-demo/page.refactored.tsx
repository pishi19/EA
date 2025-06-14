"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Map, Plus, Sidebar, CheckSquare, RefreshCw } from "lucide-react";
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

export default function WorkstreamFilterDemoRefactored() {
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
    const [roadmapContent, setRoadmapContent] = useState<string>('');
    const [roadmapLoading, setRoadmapLoading] = useState(true);
    const [roadmapOpen, setRoadmapOpen] = useState(false);

    // Tree navigation and roadmap
    const treeState = useTreeState();
    const roadmapHierarchy = useRoadmapHierarchy();

    // Load roadmap content
    useEffect(() => {
        const loadRoadmap = async () => {
            try {
                setRoadmapLoading(true);
                const response = await fetch('/api/system-docs?file=roadmap.md');
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.selectedFile?.content) {
                        setRoadmapContent(data.selectedFile.content);
                    }
                }
            } catch (err) {
                console.warn('Error loading roadmap:', err);
            } finally {
                setRoadmapLoading(false);
            }
        };

        loadRoadmap();
    }, []);

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
                <h1 className="text-3xl font-bold">Workstream</h1>
                <p className="text-lg text-muted-foreground">
                    Hierarchical Tree Navigation + Roadmap-Driven Filtering: Workstream → Program → Project → Artefact Type → Status
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                    <span>Total: <strong>{optimisticArtefacts.length}</strong> artefacts</span>
                    <span>Filtered: <strong>{filteredArtefacts.length}</strong> shown</span>
                    <span>Workstreams: <strong>{filterOptions.workstreams.length - 1}</strong></span>
                    <span>Programs: <strong>{filterOptions.programs.length - 1}</strong> (roadmap)</span>
                    <span>Projects: <strong>{filterOptions.projects.length - 1}</strong> (roadmap)</span>
                    <span>Tasks: <strong>{filterOptions.tasks.length - 1}</strong> (roadmap)</span>
                    <span>Types: <strong>{filterOptions.artefactTypes.length - 1}</strong></span>
                    {roadmapHierarchy.loading && (
                        <span className="text-orange-600">
                            <strong>Loading roadmap...</strong>
                        </span>
                    )}
                    {batchState.selectedTasks.size > 0 && (
                        <span className="text-blue-600">
                            <strong>{batchState.selectedTasks.size}</strong> selected
                        </span>
                    )}
                </div>
            </div>

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

            {/* Roadmap Collapsible */}
            <Card>
                <Collapsible open={roadmapOpen} onOpenChange={setRoadmapOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center">
                                    <Map className="mr-2 h-5 w-5" />
                                    📋 Roadmap.md (Source of Truth)
                                </span>
                                {roadmapOpen ? <ChevronUp /> : <ChevronDown />}
                            </CardTitle>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                            {roadmapContent ? (
                                <div 
                                    className="prose max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: roadmapContent }}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Roadmap content not available</p>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

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

            {/* Three-column Layout: Tree Navigation + Artefacts + Context Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tree Navigation */}
                <div className="lg:col-span-1">
                    <TreeNavigation 
                        artefacts={optimisticArtefacts}
                        roadmapHierarchy={roadmapHierarchy.hierarchy}
                        onNodeSelect={handleTreeNodeSelect}
                        validateArtefactAlignment={roadmapHierarchy.validateArtefactAlignment}
                        workstream={filters.workstream}
                    />
                </div>

                {/* Main Artefacts List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>📋 Artefacts</CardTitle>
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
                    <ContextPane />
                </div>
            </div>
        </div>
    );
} 