"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Calendar, Tag, Hash, Users, Target, ChevronDown, ChevronUp, Map, Plus } from "lucide-react";
import { InlineTaskEditor } from '@/components/inline-task-editor';
import { TaskMutationControls, TaskCard } from '@/components/task-mutation-controls';
import { BatchTaskControls, SelectableTaskCard } from '@/components/batch-task-controls';

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
    'Ora': ['Phase 11', 'Phase 10', 'Phase 9', 'Phase 8', 'Phase 7'],
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

    // Computed hierarchical filter options based on canonical taxonomy (using optimistic state)
    const availableWorkstreams = useMemo(() => {
        const workstreams = new Set<string>();
        optimisticArtefacts.forEach(artefact => {
            // Default all artefacts to 'Ora' workstream if not set or non-canonical
            const workstream = artefact.workstream && CANONICAL_WORKSTREAMS.includes(artefact.workstream) 
                ? artefact.workstream 
                : 'Ora';
            workstreams.add(workstream);
        });
        return ['all', ...Array.from(workstreams).sort()];
    }, [optimisticArtefacts]);

    const availablePrograms = useMemo(() => {
        const programs = new Set<string>();
        
        optimisticArtefacts.forEach(artefact => {
            // Use program field if available, otherwise construct from phase
            let programName = '';
            if (artefact.program) {
                programName = artefact.program;
            } else if (artefact.phase && typeof artefact.phase === 'string' && artefact.phase.trim()) {
                // Smart phase-to-program mapping
                const phaseNum = artefact.phase.split('.')[0];
                switch (phaseNum) {
                    case '11':
                        programName = 'Phase 11 – Artefact Hierarchy and Filtering';
                        break;
                    case '10':
                        programName = 'Phase 10 – API Integration and Backend';
                        break;
                    case '9':
                        programName = 'Phase 9 – Strategic Planning and Analysis';
                        break;
                    case '8':
                        programName = 'Phase 8 – Data Quality Framework';
                        break;
                    case '7':
                        programName = 'Phase 7 – Memory System';
                        break;
                    default:
                        programName = `Phase ${phaseNum}`;
                }
            }
            
            if (programName) {
                programs.add(programName);
            }
        });

        if (selectedWorkstream !== 'all') {
            // Filter programs based on selected workstream using canonical mapping
            const canonicalPrograms = CANONICAL_PROGRAMS[selectedWorkstream as keyof typeof CANONICAL_PROGRAMS] || [];
            const filteredPrograms = Array.from(programs).filter(program => 
                canonicalPrograms.includes(program)
            );
            return ['all', ...filteredPrograms.sort()];
        }
        
        return ['all', ...Array.from(programs).sort()];
    }, [optimisticArtefacts, selectedWorkstream]);

    const availableProjects = useMemo(() => {
        if (selectedProgram === 'all') {
            const projects = new Set<string>();
            optimisticArtefacts.forEach(artefact => {
                if (artefact.tags && artefact.tags.length > 0) {
                    artefact.tags.forEach(tag => {
                        if (tag && !tag.startsWith('#')) {
                            projects.add(tag);
                        }
                    });
                }
            });
            return ['all', ...Array.from(projects).sort()];
        } else {
            // Filter projects based on selected program using canonical mapping
            const canonicalProjects = CANONICAL_PROJECTS[selectedProgram as keyof typeof CANONICAL_PROJECTS] || [];
            return ['all', ...canonicalProjects];
        }
    }, [optimisticArtefacts, selectedProgram]);

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

    // Filtered artefacts based on hierarchical taxonomy selection (using optimistic state)
    const filteredArtefacts = useMemo(() => {
        let filtered = optimisticArtefacts;

        // Apply taxonomy compliance: normalize workstream to 'Ora' if not canonical
        filtered = filtered.map(artefact => {
            const normalizedWorkstream = artefact.workstream && CANONICAL_WORKSTREAMS.includes(artefact.workstream) 
                ? artefact.workstream 
                : 'Ora';
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

        // Program (Phase) filtering  
        if (selectedProgram !== 'all') {
            const phaseNum = selectedProgram.replace('Phase ', '');
            filtered = filtered.filter(artefact => artefact.phase === phaseNum);
        }

        // Project filtering (based on tags and canonical project mapping)
        if (selectedProject !== 'all') {
            filtered = filtered.filter(artefact => 
                artefact.tags && artefact.tags.some(tag => 
                    tag.toLowerCase().includes(selectedProject.toLowerCase()) ||
                    selectedProject.toLowerCase().includes(tag.toLowerCase())
                )
            );
        }

        // Artefact type filtering
        if (selectedArtefactType !== 'all') {
            filtered = filtered.filter(artefact => artefact.type === selectedArtefactType);
        }

        // Status filtering
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(artefact => artefact.status === selectedStatus);
        }

        // Only show artefacts that are taxonomy-compliant and roadmap-aligned
        filtered = filtered.filter(artefact => {
            // Must have valid workstream
            const hasValidWorkstream = CANONICAL_WORKSTREAMS.includes(artefact.workstream);
            
            // Must have valid phase if program is selected
            const hasValidPhase = !selectedProgram || selectedProgram === 'all' || 
                artefact.phase && artefact.phase.trim() !== '';

            // Must have valid type
            const hasValidType = CANONICAL_ARTEFACT_TYPES.includes(artefact.type);

            return hasValidWorkstream && hasValidPhase && hasValidType;
        });

        return filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }, [optimisticArtefacts, selectedWorkstream, selectedProgram, selectedProject, selectedArtefactType, selectedStatus]);

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
                <h1 className="text-3xl font-bold">Canonical Taxonomy Filter Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Hierarchical Taxonomy Filtering: Workstream → Program → Project → Artefact Type → Status
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                    <span>Total: <strong>{optimisticArtefacts.length}</strong> artefacts</span>
                    <span>Filtered: <strong>{filteredArtefacts.length}</strong> shown</span>
                    <span>Workstreams: <strong>{availableWorkstreams.length - 1}</strong></span>
                    <span>Programs: <strong>{availablePrograms.length - 1}</strong></span>
                    <span>Types: <strong>{availableArtefactTypes.length - 1}</strong></span>
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
                    <CardTitle>🏗️ Canonical Taxonomy Hierarchical Filters</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Hierarchical filtering: Workstream → Program → Project → Artefact Type (with status)
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
                                        <SelectItem key={program} value={program}>
                                            {program === 'all' ? 'All Programs' : program}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availablePrograms.length - 1} programs available
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
                                        <SelectItem key={project} value={project}>
                                            {project === 'all' ? 'All Projects' : project}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableProjects.length - 1} projects available
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

                        <div className="flex items-end">
                            <Button 
                                variant="outline" 
                                onClick={clearAllFilters}
                                className="w-full"
                            >
                                Clear All Filters
                            </Button>
                        </div>

                        <div className="flex items-end">
                            <Button 
                                variant="outline" 
                                onClick={loadArtefacts}
                                className="w-full"
                            >
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

            {/* Taxonomy Information */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Canonical Taxonomy Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-medium text-green-700">✅ Taxonomy Structure</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• <strong>Workstream</strong>: Default "Ora" (all artefacts belong to Ora workstream)</li>
                                <li>• <strong>Program</strong>: Phase-based organization (Phase 11, 10, 9, etc.)</li>
                                <li>• <strong>Project</strong>: Project groupings within programs</li>
                                <li>• <strong>Artefact Type</strong>: task, note, thought, execution, loop</li>
                                <li>• <strong>Status</strong>: planning, in_progress, complete, blocked</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-700">🔧 Taxonomy Features</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• Hierarchical filters with dependency cascading</li>
                                <li>• Taxonomy compliance enforcement (orphaned items hidden)</li>
                                <li>• Real-time filtering with canonical validation</li>
                                <li>• Roadmap structure alignment and integration</li>
                                <li>• Default workstream "Ora" for all artefacts</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6 text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-purple-800 font-medium">
                            🎯 Taxonomy-compliant filtering: {filteredArtefacts.length} of {artefacts.length} artefacts shown
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 