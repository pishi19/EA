"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Calendar, Tag, Hash, Users, Target, ChevronDown, ChevronUp, Map, Plus, Sidebar } from "lucide-react";
import { InlineTaskEditor } from '@/components/inline-task-editor';
import { TaskMutationControls, TaskCard } from '@/components/task-mutation-controls';
import { BatchTaskControls, SelectableTaskCard } from '@/components/batch-task-controls';

// Import tree navigation components
import TreeNavigation from './TreeNavigation';
import ContextPane from './ContextPane';
import useTreeState from './useTreeState';
import useRoadmapHierarchy from './useRoadmapHierarchy';

// --- Types ---
interface Artefact {
    id: string;
    name: string;
    title: string;
    phase: string;
    workstream: string;
    program?: string; // canonical program name
    status: string;
    score: number;
    tags: string[];
    created: string;
    uuid: string;
    summary: string;
    filePath: string;
    origin: string;
    type?: string; // artefact type: task, note, thought
}

// --- Canonical Taxonomy Schema ---
const CANONICAL_WORKSTREAMS = [
    'Ora', // Default workstream - all artefacts must belong to Ora
    'workstream-ui',
    'system-integrity', 
    'reasoning',
    'memory'
];

const CANONICAL_PROGRAMS = {
    'Ora': [
        'Phase 11 – Artefact Hierarchy and Filtering',
        'Phase 10 – API Integration and Backend', 
        'Phase 9 – Strategic Planning and Analysis',
        'Phase 8 – Data Quality Framework',
        'Phase 7 – Memory System'
    ],
    'workstream-ui': ['Phase 11.1', 'Phase 11.2', 'Phase 10.1'],
    'system-integrity': ['Phase 10.2', 'Phase 10.3', 'Phase 9.1'],
    'reasoning': ['Phase 9.1', 'Phase 8.1', 'Phase 8.2'],
    'memory': ['Phase 7.0', 'Phase 7.1']
};

const CANONICAL_PROJECTS = {
    'Phase 11': ['Artefact Hierarchy and Filtering', 'Inline Task Mutation', 'Taxonomy Enforcement'],
    'Phase 11.1': ['Artefact Schema and Canonicalization', 'UI Component Architecture'],
    'Phase 11.2': ['Semantic Chat Demo Filtering', 'Enhanced Filter Implementation', 'Inline Task Mutation in Filtered View', 'Taxonomy-Driven Filtering Enforcement'],
    'Phase 10': ['API Integration', 'System Enhancement', 'Backend Optimization'],
    'Phase 10.2': ['API Integration Work', 'Backend Optimization'],
    'Phase 10.3': ['System Integration & Enhancement'],
    'Phase 9': ['Strategic Planning', 'Performance Analysis', 'Architecture Analysis'],
    'Phase 9.1': ['Strategic Planning & Architecture Analysis', 'Performance Analysis'],
    'Phase 8': ['Data Quality', 'Reasoning System Enhancement'],
    'Phase 8.1': ['Data Quality Framework'],
    'Phase 8.2': ['Reasoning System Enhancement'],
    'Phase 7': ['Memory System', 'Core Architecture']
};

const CANONICAL_ARTEFACT_TYPES = [
    'task',
    'note', 
    'thought',
    'execution',
    'loop'
];

// --- Component ---
export default function WorkstreamFilterDemo() {
    const [artefacts, setArtefacts] = useState<Artefact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Roadmap display states
    const [roadmapContent, setRoadmapContent] = useState<string>('');
    const [roadmapLoading, setRoadmapLoading] = useState(true);
    const [roadmapOpen, setRoadmapOpen] = useState(false);

    // Filter states - hierarchical cascade
    const [selectedWorkstream, setSelectedWorkstream] = useState<string>('Ora'); // Default to Ora workstream
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [selectedArtefactType, setSelectedArtefactType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Task mutation states
    const [editingTask, setEditingTask] = useState<Artefact | null>(null);
    const [addingTask, setAddingTask] = useState<boolean>(false);
    const [mutationLoading, setMutationLoading] = useState<boolean>(false);
    const [mutationError, setMutationError] = useState<string | null>(null);

    // Optimistic UI states
    const [optimisticArtefacts, setOptimisticArtefacts] = useState<Artefact[]>([]);
    const [pendingMutations, setPendingMutations] = useState<Set<string>>(new Set());
    const [failedMutations, setFailedMutations] = useState<Set<string>>(new Set());

    // Batch operation states
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [batchMode, setBatchMode] = useState<boolean>(false);

    // Tree navigation state
    const treeState = useTreeState();

    // Roadmap hierarchy state - source of truth for programs and projects
    const roadmapHierarchy = useRoadmapHierarchy();

    // Load roadmap content from API
    const loadRoadmap = async () => {
        try {
            setRoadmapLoading(true);
            const response = await fetch('/api/system-docs?file=roadmap.md');
            
            if (!response.ok) {
                console.warn('Failed to load roadmap:', response.status);
                return;
            }
            
            const data = await response.json();
            if (data.selectedFile && data.selectedFile.content) {
                setRoadmapContent(data.selectedFile.content);
            }
        } catch (err) {
            console.warn('Error loading roadmap:', err);
        } finally {
            setRoadmapLoading(false);
        }
    };

    // Load artefacts from API
    const loadArtefacts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/demo-loops');
            
            if (!response.ok) {
                throw new Error(`Failed to load artefacts: ${response.status}`);
            }
            
            const artefactsData = await response.json();
            setArtefacts(artefactsData);
            
        } catch (err) {
            console.error('Error loading artefacts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load artefacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoadmap();
        loadArtefacts();
    }, []);

    // Sync optimistic artefacts with loaded artefacts
    useEffect(() => {
        if (artefacts.length > 0) {
            setOptimisticArtefacts(artefacts);
            }
    }, [artefacts]);

    // Sync tree navigation with filter selections
    useEffect(() => {
        treeState.syncWithFilters(selectedWorkstream, selectedProgram, selectedProject);
    }, [selectedWorkstream, selectedProgram, selectedProject]);

    // Computed hierarchical filter options based on roadmap.md (source of truth)
    const availableWorkstreams = useMemo(() => {
        if (roadmapHierarchy.loading || !roadmapHierarchy.hierarchy) {
            return ['all', 'Ora']; // Default fallback
        }
        return roadmapHierarchy.getAvailableWorkstreams();
    }, [roadmapHierarchy.hierarchy, roadmapHierarchy.loading]);

    const availablePrograms = useMemo(() => {
        if (roadmapHierarchy.loading || !roadmapHierarchy.hierarchy) {
            return []; // No programs until roadmap loads
        }
        
        const roadmapPrograms = roadmapHierarchy.getAvailablePrograms(selectedWorkstream);
        return [
            { id: 'all', name: 'All Programs', fullName: 'All Programs', status: 'all' },
            ...roadmapPrograms
        ];
    }, [roadmapHierarchy.hierarchy, roadmapHierarchy.loading, selectedWorkstream]);

    const availableProjects = useMemo(() => {
        if (roadmapHierarchy.loading || !roadmapHierarchy.hierarchy) {
            return []; // No projects until roadmap loads
        }
        
        // Find selected program by matching fullName or id
        let selectedProgramId = selectedProgram;
        if (selectedProgram !== 'all') {
            const program = roadmapHierarchy.hierarchy.programs.find(p => 
                p.fullName === selectedProgram || 
                p.id === selectedProgram ||
                p.name === selectedProgram
            );
            selectedProgramId = program ? program.id : selectedProgram;
        }
        
        const roadmapProjects = roadmapHierarchy.getAvailableProjects(selectedProgramId);
        return [
            { id: 'all', name: 'All Projects', fullName: 'All Projects', status: 'all' },
            ...roadmapProjects
        ];
    }, [roadmapHierarchy.hierarchy, roadmapHierarchy.loading, selectedProgram]);

    const availableArtefactTypes = useMemo(() => {
        const types = new Set<string>();
        optimisticArtefacts.forEach(artefact => {
            // Default to 'task' if type not set or not canonical
            const type = artefact.type && CANONICAL_ARTEFACT_TYPES.includes(artefact.type) 
                ? artefact.type 
                : 'task';
            types.add(type);
        });
        return ['all', ...Array.from(types).sort()];
    }, [optimisticArtefacts]);

    const availableStatuses = useMemo(() => {
        const statuses = new Set<string>();
        optimisticArtefacts.forEach(artefact => {
            if (artefact.status) {
                statuses.add(artefact.status);
            }
        });
        return ['all', ...Array.from(statuses).sort()];
    }, [optimisticArtefacts]);

    // Filtered artefacts based on roadmap-driven hierarchy validation
    const filteredArtefacts = useMemo(() => {
        let filtered = optimisticArtefacts;

        // Apply basic normalization
        filtered = filtered.map(artefact => {
            const normalizedWorkstream = artefact.workstream || 'Ora';
            const artefactType = artefact.type || 'task';
            const normalizedType = CANONICAL_ARTEFACT_TYPES.includes(artefactType) 
                ? artefactType 
                : 'task';
            
            return {
                ...artefact,
                workstream: normalizedWorkstream,
                type: normalizedType
            };
        });

        // Workstream filtering
        if (selectedWorkstream !== 'all') {
            filtered = filtered.filter(artefact => artefact.workstream === selectedWorkstream);
        }

        // Roadmap-driven program filtering
        if (selectedProgram !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedProgramData = roadmapHierarchy.hierarchy.programs.find(p => 
                p.id === selectedProgram || 
                p.fullName === selectedProgram ||
                p.name === selectedProgram
            );
            
            if (selectedProgramData) {
                filtered = filtered.filter(artefact => {
                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                    return alignment.validProgram?.id === selectedProgramData.id ||
                           alignment.validProgram?.phase === selectedProgramData.phase;
                });
        }
        }

        // Roadmap-driven project filtering
        if (selectedProject !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedProjectData = roadmapHierarchy.hierarchy.projects.find(p => 
                p.id === selectedProject || 
                p.fullName === selectedProject ||
                p.name === selectedProject
            );
            
            if (selectedProjectData) {
                filtered = filtered.filter(artefact => {
                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                    return alignment.validProjects.some(proj => proj.id === selectedProjectData.id);
                });
            }
        }

        // Artefact type filtering
        if (selectedArtefactType !== 'all') {
            filtered = filtered.filter(artefact => artefact.type === selectedArtefactType);
        }

        // Status filtering
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(artefact => artefact.status === selectedStatus);
        }

        // Roadmap alignment validation - only show artefacts that align with roadmap
        if (roadmapHierarchy.hierarchy) {
            filtered = filtered.filter(artefact => {
                const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                return alignment.isValid; // Only show artefacts with valid roadmap alignment
            });
        }

        return filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }, [optimisticArtefacts, selectedWorkstream, selectedProgram, selectedProject, selectedArtefactType, selectedStatus, roadmapHierarchy.hierarchy]);

    // Reset cascade when parent selection changes
    const handleWorkstreamChange = (value: string) => {
        setSelectedWorkstream(value);
        setSelectedProgram('all');
        setSelectedProject('all');
    };

    const handleProgramChange = (value: string) => {
        setSelectedProgram(value);
        setSelectedProject('all');
    };

    const clearAllFilters = () => {
        setSelectedWorkstream('Ora'); // Reset to default Ora workstream
        setSelectedProgram('all');
        setSelectedProject('all');
        setSelectedArtefactType('all');
        setSelectedStatus('all');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'complete': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Task mutation handlers
    const handleAddTask = () => {
        setAddingTask(true);
        setEditingTask(null);
        setMutationError(null);
    };

    const handleEditTask = (artefact: Artefact) => {
        setEditingTask(artefact);
        setAddingTask(false);
        setMutationError(null);
    };

    const handleDeleteTask = async (artefact: Artefact) => {
        const tempId = `deleting-${artefact.id}`;
        
        try {
            setMutationError(null);
            
            // Optimistic update: mark as pending and remove from UI
            setPendingMutations(prev => new Set([...prev, artefact.id]));
            setOptimisticArtefacts(prev => prev.filter(a => a.id !== artefact.id));

            const response = await fetch('/api/task-mutations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    taskId: artefact.uuid
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete task');
            }

            // Success: remove from pending, refresh from server
            setPendingMutations(prev => {
                const newSet = new Set(prev);
                newSet.delete(artefact.id);
                return newSet;
            });
            await loadArtefacts();
            
        } catch (err) {
            console.error('Error deleting task:', err);
            
            // Rollback: restore the artefact and mark as failed
            setOptimisticArtefacts(prev => {
                const restored = [...prev, artefact].sort((a, b) => 
                    new Date(b.created).getTime() - new Date(a.created).getTime()
                );
                return restored;
            });
            
            setPendingMutations(prev => {
                const newSet = new Set(prev);
                newSet.delete(artefact.id);
                return newSet;
            });
            
            setFailedMutations(prev => new Set([...prev, artefact.id]));
            setMutationError(err instanceof Error ? err.message : 'Failed to delete task');
            
            // Clear failed state after 3 seconds
            setTimeout(() => {
                setFailedMutations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(artefact.id);
                    return newSet;
                });
            }, 3000);
        }
    };

    const handleSaveTask = async (taskData: any) => {
        const action = editingTask ? 'edit' : 'add';
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let originalArtefact: Artefact | null = null;
        
        try {
            setMutationLoading(true);
            setMutationError(null);

            const payload: any = {
                action,
                taskData: {
                    title: taskData.title,
                    description: taskData.description,
                    status: taskData.status,
                    phase: taskData.phase,
                    workstream: taskData.workstream,
                    tags: taskData.tags
                }
            };

            if (editingTask) {
                payload.taskId = editingTask.uuid;
                originalArtefact = editingTask;
                
                // Optimistic update for edit: update existing artefact
                const optimisticEdit: Artefact = {
                    ...editingTask,
                    title: taskData.title,
                    status: taskData.status,
                    phase: taskData.phase,
                    workstream: taskData.workstream,
                    tags: taskData.tags,
                    summary: taskData.description || editingTask.summary
                };
                
                setPendingMutations(prev => new Set([...prev, editingTask.id]));
                setOptimisticArtefacts(prev => 
                    prev.map(a => a.id === editingTask.id ? optimisticEdit : a)
                );
            } else {
                // Optimistic update for add: create temporary artefact
                const optimisticAdd: Artefact = {
                    id: tempId,
                    name: tempId,
                    title: taskData.title,
                    phase: taskData.phase,
                    workstream: taskData.workstream,
                    status: taskData.status,
                    score: 0,
                    tags: taskData.tags,
                    created: new Date().toISOString().split('T')[0],
                    uuid: tempId,
                    summary: taskData.description || 'New task pending confirmation...',
                    filePath: `runtime/loops/${tempId}.md`,
                    origin: 'ui-add'
                };
                
                setPendingMutations(prev => new Set([...prev, tempId]));
                setOptimisticArtefacts(prev => [optimisticAdd, ...prev]);
            }

            const response = await fetch('/api/task-mutations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} task`);
            }

            // Success: remove from pending and refresh from server
            const pendingId = editingTask ? editingTask.id : tempId;
            setPendingMutations(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingId);
                return newSet;
            });

            // Reset states and refresh artefacts
            setEditingTask(null);
            setAddingTask(false);
            await loadArtefacts();
            
        } catch (err) {
            console.error('Error saving task:', err);
            
            // Rollback optimistic updates
            const pendingId = editingTask ? editingTask.id : tempId;
            
            setPendingMutations(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingId);
                return newSet;
            });
            
            if (editingTask && originalArtefact) {
                // Rollback edit: restore original artefact
                setOptimisticArtefacts(prev => 
                    prev.map(a => a.id === editingTask.id ? originalArtefact! : a)
                );
                setFailedMutations(prev => new Set([...prev, editingTask.id]));
            } else {
                // Rollback add: remove temporary artefact
                setOptimisticArtefacts(prev => prev.filter(a => a.id !== tempId));
                setFailedMutations(prev => new Set([...prev, tempId]));
            }
            
            setMutationError(err instanceof Error ? err.message : 'Failed to save task');
            
            // Clear failed state after 3 seconds
            setTimeout(() => {
                setFailedMutations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(pendingId);
                    return newSet;
                });
            }, 3000);
        } finally {
            setMutationLoading(false);
        }
    };

    const handleCancelMutation = () => {
        setEditingTask(null);
        setAddingTask(false);
        setMutationError(null);
    };

    // Batch operation handlers
    const handleTaskSelectionChange = (taskId: string, selected: boolean) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(taskId);
            } else {
                newSet.delete(taskId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedTasks(new Set(filteredArtefacts.map(a => a.id)));
    };

    const handleSelectNone = () => {
        setSelectedTasks(new Set());
    };

    const handleBatchDelete = async (tasks: any[]) => {
        const operations = tasks.map((task, index) => ({
            action: 'delete' as const,
            taskId: task.uuid,
            operationId: `batch-delete-${index}-${Date.now()}`
        }));

        try {
            const response = await fetch('/api/task-mutations/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operations })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Batch delete failed');
            }

            const result = await response.json();
            
            // Handle partial failures
            if (!result.success && result.results) {
                const failedIds = result.results
                    .filter((r: any) => !r.success)
                    .map((r: any) => r.operationId);
                
                if (failedIds.length > 0) {
                    setMutationError(`Some deletions failed: ${failedIds.length} errors`);
                }
            }

            // Refresh artefacts
            await loadArtefacts();
            
        } catch (error) {
            console.error('Batch delete error:', error);
            setMutationError(error instanceof Error ? error.message : 'Batch delete failed');
        }
    };

    const handleBatchEdit = async (tasks: any[]) => {
        // For now, just log - would need a batch edit form
        console.log('Batch edit requested for tasks:', tasks);
        setMutationError('Batch edit not yet implemented - coming soon!');
    };

    const toggleBatchMode = () => {
        setBatchMode(!batchMode);
        if (batchMode) {
            setSelectedTasks(new Set());
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Workstream Filter Demo</h1>
                    <p className="text-muted-foreground">Loading canonical artefacts with hierarchical filtering...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Workstream Filter Demo</h1>
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <Button onClick={loadArtefacts}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Roadmap-Driven Tree Navigation</h1>
                <p className="text-lg text-muted-foreground">
                    Hierarchical Tree Navigation + Roadmap-Driven Filtering: Workstream → Program → Project → Artefact Type → Status
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                    <span>Total: <strong>{optimisticArtefacts.length}</strong> artefacts</span>
                    <span>Filtered: <strong>{filteredArtefacts.length}</strong> shown</span>
                    <span>Workstreams: <strong>{availableWorkstreams.length - 1}</strong></span>
                    <span>Programs: <strong>{availablePrograms.length - 1}</strong> (roadmap)</span>
                    <span>Projects: <strong>{availableProjects.length - 1}</strong> (roadmap)</span>
                    <span>Types: <strong>{availableArtefactTypes.length - 1}</strong></span>
                    {roadmapHierarchy.loading && (
                        <span className="text-orange-600">
                            <strong>Loading roadmap...</strong>
                        </span>
                    )}
                    {roadmapHierarchy.error && (
                        <span className="text-red-600">
                            <strong>Roadmap error</strong>
                        </span>
                    )}
                    {selectedTasks.size > 0 && (
                        <span className="text-blue-600">
                            <strong>{selectedTasks.size}</strong> selected
                        </span>
                    )}
                    {pendingMutations.size > 0 && (
                        <span className="text-yellow-600">
                            <strong>{pendingMutations.size}</strong> pending
                        </span>
                    )}
                    {treeState.selectedArtefact && (
                        <span className="text-purple-600">
                            <strong>"{treeState.selectedArtefact.title}"</strong> selected
                        </span>
                    )}
                </div>
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={treeState.toggleTreeVisibility}
                        className="flex items-center gap-2"
                    >
                        <Sidebar className="h-4 w-4" />
                        {treeState.treeVisible ? 'Hide Tree' : 'Show Tree'}
                    </Button>
                </div>
            </div>

            {/* Roadmap Display */}
            <Card className="border-t-4 border-t-indigo-500">
                <Collapsible open={roadmapOpen} onOpenChange={setRoadmapOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Map className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-xl">📍 System Roadmap</CardTitle>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {roadmapLoading ? (
                                        <span className="text-sm text-muted-foreground">Loading...</span>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">
                                            Click to {roadmapOpen ? 'collapse' : 'expand'}
                                        </Badge>
                                    )}
                                    {roadmapOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground text-left">
                                Reference roadmap showing current phase progress and hierarchical structure
                            </p>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="border-t">
                            {roadmapLoading ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Loading roadmap content...</p>
                                </div>
                            ) : roadmapContent ? (
                                <div 
                                    className="prose prose-sm max-w-none mt-4"
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

            {/* Hierarchical Filter Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>🏗️ Roadmap-Driven Hierarchical Filters</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Hierarchical filtering based on roadmap.md structure: Workstream → Program → Project → Artefact Type (with status)
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Users className="inline h-4 w-4 mr-1" />
                                Workstream
                            </label>
                            <Select value={selectedWorkstream} onValueChange={handleWorkstreamChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableWorkstreams.map(ws => (
                                        <SelectItem key={ws} value={ws}>
                                            {ws === 'all' ? 'All Workstreams' : ws}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableWorkstreams.length - 1} canonical workstreams
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Target className="inline h-4 w-4 mr-1" />
                                Program (Phase)
                            </label>
                            <Select value={selectedProgram} onValueChange={handleProgramChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availablePrograms.map(program => (
                                        <SelectItem key={program.id} value={program.id}>
                                            {(program as any).displayLabel || program.fullName || program.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availablePrograms.length - 1} programs from roadmap.md
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Hash className="inline h-4 w-4 mr-1" />
                                Project
                            </label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableProjects.map(project => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {(project as any).displayLabel || project.fullName || project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableProjects.length - 1} projects from roadmap.md
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FileText className="inline h-4 w-4 mr-1" />
                                Artefact Type
                            </label>
                            <Select value={selectedArtefactType} onValueChange={setSelectedArtefactType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableArtefactTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type === 'all' ? 'All Types' : type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableArtefactTypes.length - 1} types available
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Status
                            </label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableStatuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status === 'all' ? 'All Statuses' : status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableStatuses.length - 1} statuses available
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Actions
                            </label>
                            <Button 
                                variant="outline" 
                                onClick={clearAllFilters}
                                className="w-full"
                            >
                                Clear All Filters
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">
                                Reset to defaults
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data
                            </label>
                            <Button 
                                variant="outline" 
                                onClick={loadArtefacts}
                                className="w-full"
                            >
                                Refresh Data
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">
                                Reload from API
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tree Navigation + Context Pane Layout */}
            {treeState.treeVisible && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tree Navigation */}
                    <div className="lg:col-span-1">
                        <TreeNavigation
                            artefacts={filteredArtefacts}
                            roadmapHierarchy={roadmapHierarchy.hierarchy}
                            onNodeSelect={treeState.selectNode}
                            selectedNodeId={treeState.selectedNode?.id}
                            validateArtefactAlignment={roadmapHierarchy.validateArtefactAlignment}
                            className="sticky top-6"
                        />
                    </div>

                    {/* Context Pane */}
                    <div className="lg:col-span-2">
                        <ContextPane
                            selectedNode={treeState.selectedNode || undefined}
                            selectedArtefact={treeState.selectedArtefact || undefined}
                            className="sticky top-6"
                        />
                    </div>
                </div>
            )}

            {/* Orphan Artefacts Detection */}
            {roadmapHierarchy.hierarchy && (
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <span>🔍 Roadmap Alignment Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const orphanArtefacts = optimisticArtefacts.filter(artefact => {
                                const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                                return !alignment.isValid;
                            });

                            const alignedArtefacts = optimisticArtefacts.filter(artefact => {
                                const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                                return alignment.isValid;
                            });

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-green-700">✅ Roadmap-Aligned Artefacts</h4>
                                        <p className="text-sm text-muted-foreground">
                                            <strong>{alignedArtefacts.length}</strong> artefacts properly linked to roadmap programs/projects
                                        </p>
                                        {alignedArtefacts.length > 0 && (
                                            <div className="text-xs space-y-1">
                                                {alignedArtefacts.slice(0, 3).map(artefact => {
                                                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                                                    return (
                                                        <div key={artefact.id} className="bg-green-50 p-2 rounded">
                                                            <strong>{artefact.title}</strong> → {alignment.validProgram?.name}
                                                            {alignment.validProjects.length > 0 && (
                                                                <span> / {alignment.validProjects[0].name}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {alignedArtefacts.length > 3 && (
                                                    <p className="text-xs text-gray-500">...and {alignedArtefacts.length - 3} more</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-orange-700">⚠️ Orphan Artefacts</h4>
                                        <p className="text-sm text-muted-foreground">
                                            <strong>{orphanArtefacts.length}</strong> artefacts not aligned with roadmap structure
                                        </p>
                                        {orphanArtefacts.length > 0 && (
                                            <div className="text-xs space-y-1">
                                                {orphanArtefacts.slice(0, 3).map(artefact => {
                                                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                                                    return (
                                                        <div key={artefact.id} className="bg-orange-50 p-2 rounded">
                                                            <strong>{artefact.title}</strong>
                                                            <br />
                                                            <span className="text-orange-600">
                                                                Phase: {artefact.phase || 'none'}, 
                                                                Orphan tags: {alignment.orphanTags.join(', ') || 'none'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {orphanArtefacts.length > 3 && (
                                                    <p className="text-xs text-gray-500">...and {orphanArtefacts.length - 3} more orphans</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}

            {/* Filtered Artefacts Display */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                    <CardTitle>📋 Filtered Task Artefacts ({filteredArtefacts.length})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Showing artefacts matching current hierarchical filter selection
                                {batchMode && ' - Batch mode enabled'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={toggleBatchMode}
                                variant={batchMode ? "default" : "outline"}
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                {batchMode ? '🔄 Exit Batch' : '⚡ Batch Mode'}
                            </Button>
                            {!batchMode && (
                                <TaskMutationControls
                                    showAddButton={true}
                                    onAdd={handleAddTask}
                                    disabled={mutationLoading}
                                    size="lg"
                                />
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Batch Controls */}
                    {batchMode && (
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
                                selectedTasks={selectedTasks}
                                onTaskSelectionChange={handleTaskSelectionChange}
                                onSelectAll={handleSelectAll}
                                onSelectNone={handleSelectNone}
                                onBatchEdit={handleBatchEdit}
                                onBatchDelete={handleBatchDelete}
                                onBatchAdd={handleAddTask}
                                disabled={mutationLoading}
                            />
                        </div>
                    )}

                    {/* Inline Task Editor */}
                    {(addingTask || editingTask) && !batchMode && (
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
                                onDelete={editingTask ? () => handleDeleteTask(editingTask) : undefined}
                                onCancel={handleCancelMutation}
                                isLoading={mutationLoading}
                                error={mutationError}
                            />
                        </div>
                    )}

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
                                const isPending = pendingMutations.has(artefact.id);
                                const isFailed = failedMutations.has(artefact.id);
                                const task = {
                                    id: artefact.id,
                                    title: artefact.title,
                                    description: artefact.summary,
                                    status: artefact.status as any,
                                    phase: artefact.phase,
                                    workstream: artefact.workstream,
                                    tags: artefact.tags,
                                    uuid: artefact.uuid
                                };
                                
                                return (
                                    <div key={artefact.id} className="relative">
                                        {batchMode ? (
                                            <SelectableTaskCard
                                                task={task}
                                                selected={selectedTasks.has(artefact.id)}
                                                onSelectionChange={handleTaskSelectionChange}
                                                onEdit={() => handleEditTask(artefact)}
                                                onDelete={() => handleDeleteTask(artefact)}
                                                isPending={isPending}
                                                isFailed={isFailed}
                                                className={`border-l-4 transition-all duration-200 ${
                                                    isPending 
                                                        ? 'border-l-yellow-500 bg-yellow-50 opacity-75' 
                                                        : isFailed 
                                                            ? 'border-l-red-500 bg-red-50' 
                                                            : 'border-l-purple-500'
                                                }`}
                                            />
                                        ) : (
                                            <TaskCard
                                                task={task}
                                                onEdit={() => handleEditTask(artefact)}
                                                onDelete={() => handleDeleteTask(artefact)}
                                                className={`border-l-4 transition-all duration-200 ${
                                                    isPending 
                                                        ? 'border-l-yellow-500 bg-yellow-50 opacity-75' 
                                                        : isFailed 
                                                            ? 'border-l-red-500 bg-red-50' 
                                                            : 'border-l-purple-500'
                                                }`}
                                                showControls={!addingTask && !editingTask && !isPending}
                                            />
                                        )}
                                        
                                        {/* Pending indicator */}
                                        {isPending && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium z-10">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                                Saving...
                                                    </div>
                                                )}
                                                
                                        {/* Failed indicator */}
                                        {isFailed && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium z-10">
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                Failed - Rolled Back
                                                </div>
                                        )}
                                            </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Roadmap-Driven Architecture Information */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Roadmap-Driven Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-medium text-green-700">✅ Roadmap Structure</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• <strong>Source of Truth</strong>: Programs and projects defined in roadmap.md</li>
                                <li>• <strong>Workstream</strong>: "Ora" canonical workstream contains all programs</li>
                                <li>• <strong>Programs</strong>: Phase-based organization directly from roadmap</li>
                                <li>• <strong>Projects</strong>: Project definitions within each program</li>
                                <li>• <strong>Artefacts</strong>: Must align with roadmap programs/projects to be visible</li>
                                <li>• <strong>Validation</strong>: Real-time alignment checking against roadmap structure</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-700">🔧 Architecture Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• Roadmap.md parsing and hierarchy extraction</li>
                                <li>• Real-time orphan artefact detection and flagging</li>
                                <li>• Program/project status tracking from roadmap</li>
                                <li>• Empty branch display (programs/projects without artefacts)</li>
                                <li>• Instant UI reflection of roadmap.md changes</li>
                                <li>• Artefact creation restricted to valid roadmap entries</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 font-medium">
                            🎯 Roadmap-aligned filtering: {filteredArtefacts.length} valid artefacts shown from {optimisticArtefacts.length} total
                            {roadmapHierarchy.hierarchy && (
                                <span> | {roadmapHierarchy.hierarchy.programs.length} programs, {roadmapHierarchy.hierarchy.projects.length} projects</span>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 