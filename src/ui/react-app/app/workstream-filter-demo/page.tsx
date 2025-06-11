"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Calendar, Tag, Hash, Users, Target, ChevronDown, ChevronUp, Map, Plus, Sidebar, CheckSquare, RotateCcw, RefreshCw } from "lucide-react";
import { InlineTaskEditor } from '@/components/inline-task-editor';
import { TaskMutationControls, TaskCard } from '@/components/task-mutation-controls';
import { BatchTaskControls, SelectableTaskCard } from '@/components/batch-task-controls';
import UnifiedArtefactCard from '@/components/UnifiedArtefactCard';

// Import tree navigation components
import TreeNavigation from './TreeNavigation';
import ContextPane from './ContextPane';
import useTreeState from './useTreeState';
import useRoadmapHierarchy from './useRoadmapHierarchy';
import { useWorkstream } from '@/lib/workstream-context';

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
    // Workstream context - get current workstream from URL
    const { currentWorkstream, isValidWorkstream, loading: workstreamLoading, error: workstreamError } = useWorkstream();
    
    // Initialize workstream from context
    useEffect(() => {
        if (currentWorkstream && isValidWorkstream(currentWorkstream)) {
            setSelectedWorkstream(currentWorkstream);
        }
    }, [currentWorkstream, isValidWorkstream]);

    // Core state
    const [artefacts, setArtefacts] = useState<Artefact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Roadmap display states
    const [roadmapContent, setRoadmapContent] = useState<string>('');
    const [roadmapLoading, setRoadmapLoading] = useState(true);
    const [roadmapOpen, setRoadmapOpen] = useState(false);

    // Filter states - hierarchical cascade
    const [selectedWorkstream, setSelectedWorkstream] = useState<string>(''); // Remove hardcoded default
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<string>('all');
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
    
    // Expanded artefacts tracking
    const [expandedArtefacts, setExpandedArtefacts] = useState<Set<string>>(new Set());

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
            
            const response = await fetch(`/api/demo-loops?workstream=${selectedWorkstream}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load artefacts: ${response.status}`);
            }
            
            const response_data = await response.json();
            setArtefacts(response_data.artefacts || []);
            
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
    }, [selectedWorkstream]);

    useEffect(() => {
        if (artefacts.length > 0) {
            setOptimisticArtefacts(artefacts);
            }
    }, [artefacts]);

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

    const availableTasks = useMemo(() => {
        if (roadmapHierarchy.loading || !roadmapHierarchy.hierarchy) {
            return []; // No tasks until roadmap loads
        }
        
        // Find selected project by matching fullName or id
        let selectedProjectId = selectedProject;
        if (selectedProject !== 'all') {
            const project = roadmapHierarchy.hierarchy.projects.find(p => 
                p.fullName === selectedProject || 
                p.id === selectedProject ||
                p.name === selectedProject
            );
            selectedProjectId = project ? project.id : selectedProject;
        }
        
        // Get tasks for the selected project
        let roadmapTasks = [];
        if (selectedProjectId === 'all') {
            roadmapTasks = roadmapHierarchy.hierarchy.tasks;
        } else {
            roadmapTasks = roadmapHierarchy.hierarchy.tasks.filter(task => task.projectId === selectedProjectId);
        }
        
        return [
            { id: 'all', name: 'All Tasks', fullName: 'All Tasks', status: 'all' },
            ...roadmapTasks.map(task => ({
                id: task.id,
                name: task.name,
                fullName: task.fullName,
                displayLabel: task.displayLabel,
                status: task.status
            }))
        ];
    }, [roadmapHierarchy.hierarchy, roadmapHierarchy.loading, selectedProject]);

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

    // Sync tree navigation with filter selections (moved after all useMemo declarations)
    useEffect(() => {
        treeState.syncWithFilters(selectedWorkstream, selectedProgram, selectedProject);
    }, [selectedWorkstream, selectedProgram, selectedProject]);

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

        // Workstream filtering (case-insensitive)
        if (selectedWorkstream !== 'all') {
            filtered = filtered.filter(artefact => 
                artefact.workstream.toLowerCase() === selectedWorkstream.toLowerCase()
            );
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
                console.log('🔍 Project filtering debug:', {
                    selectedProject: selectedProjectData.name,
                    projectNumber: selectedProjectData.id.replace('project-', ''),
                    totalArtefactsBeforeFilter: filtered.length,
                    artefactSample: filtered.slice(0, 3).map(a => ({
                        title: a.title,
                        phase: a.phase,
                        tags: a.tags
                    }))
                });
                
                filtered = filtered.filter(artefact => {
                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                    
                    // Check if artefact is aligned with this specific project
                    const projectAlignment = alignment.validProjects.some(proj => proj.id === selectedProjectData.id);
                    
                    // Also check for loose matches in title, phase, or tags
                    const projectNumber = selectedProjectData.id.replace('project-', ''); // e.g., "11.3"
                    const phaseNumber = projectNumber.split('.')[0]; // e.g., "11"
                    
                    const titleMatch = artefact.title.toLowerCase().includes(projectNumber) ||
                                     artefact.title.toLowerCase().includes(selectedProjectData.name.toLowerCase());
                    
                    // Enhanced hierarchical phase matching
                    let phaseMatch = false;
                    if (artefact.phase) {
                        const artefactPhase = String(artefact.phase);
                        // Direct match (e.g., "11.2" === "11.2")
                        phaseMatch = artefactPhase === phaseNumber || artefactPhase === projectNumber;
                        
                        // Hierarchical match (e.g., "11.2.2.1" starts with "11.2")
                        if (!phaseMatch && projectNumber.includes('.')) {
                            phaseMatch = artefactPhase.startsWith(projectNumber + '.');
                        }
                        
                        // Also check if artefact phase starts with project number (e.g., "11.2.4.1" matches project "11.2")
                        if (!phaseMatch) {
                            phaseMatch = artefactPhase.startsWith(projectNumber);
                        }
                    }
                    
                    const tagMatch = artefact.tags && artefact.tags.some(tag => 
                        tag.includes(projectNumber) ||
                        tag.toLowerCase().includes(selectedProjectData.name.toLowerCase())
                    );
                    
                    const matches = projectAlignment || titleMatch || phaseMatch || tagMatch;
                    
                    if (matches && selectedProjectData.id === 'project-11.2') {
                        console.log('✅ Project 11.2 artefact matched:', {
                            title: artefact.title,
                            phase: artefact.phase,
                            tags: artefact.tags,
                            projectAlignment,
                            titleMatch,
                            phaseMatch,
                            tagMatch
                        });
                    }
                    
                    return matches;
                });
                
                console.log('✅ Project filtering result:', {
                    selectedProject: selectedProjectData.name,
                    artefactsAfterFilter: filtered.length
                });
            }
        }

        // Roadmap-driven task filtering
        if (selectedTask !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedTaskData = roadmapHierarchy.hierarchy.tasks.find(t => 
                t.id === selectedTask || 
                t.fullName === selectedTask ||
                t.name === selectedTask
            );
            
            if (selectedTaskData) {
                // Get the parent project for this task
                const parentProject = roadmapHierarchy.hierarchy.projects.find(p => 
                    p.id === selectedTaskData.projectId
                );
                
                // Filter artefacts that relate to the specific task OR the parent project
                filtered = filtered.filter(artefact => {
                    // Check if artefact title contains the task name or task ID
                    const taskTitleMatch = artefact.title.toLowerCase().includes(selectedTaskData.name.toLowerCase());
                    const taskIdMatch = artefact.title.includes(selectedTaskData.id.replace('task-', ''));
                    
                    // Check if any tags match the task ID or name
                    const taskTagMatch = artefact.tags && artefact.tags.some(tag => 
                        tag.toLowerCase().includes(selectedTaskData.name.toLowerCase()) ||
                        tag.includes(selectedTaskData.id.replace('task-', ''))
                    );
                    
                    // Also include artefacts that belong to the parent project
                    let projectMatch = false;
                    if (parentProject) {
                        const projectTitleMatch = artefact.title.toLowerCase().includes(parentProject.name.toLowerCase());
                        const projectTagMatch = artefact.tags && artefact.tags.some(tag => 
                            tag.toLowerCase().includes(parentProject.name.toLowerCase())
                        );
                        projectMatch = projectTitleMatch || projectTagMatch;
                    }
                    
                    // Show artefacts that match the task OR belong to the parent project
                    return taskTitleMatch || taskIdMatch || taskTagMatch || projectMatch;
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
    }, [optimisticArtefacts, selectedWorkstream, selectedProgram, selectedProject, selectedTask, selectedArtefactType, selectedStatus, roadmapHierarchy.hierarchy]);

    // Reset cascade when parent selection changes
    const handleWorkstreamChange = (value: string) => {
        setSelectedWorkstream(value);
        setSelectedProgram('all');
        setSelectedProject('all');
        setSelectedTask('all');
    };

    const handleProgramChange = (value: string) => {
        setSelectedProgram(value);
        setSelectedProject('all');
        setSelectedTask('all');
    };

    const handleProjectChange = (value: string) => {
        setSelectedProject(value);
        setSelectedTask('all');
    };

    const clearAllFilters = () => {
        // Preserve current workstream context instead of hardcoding
        // setSelectedWorkstream('ora'); // REMOVED: No hardcoded workstream
        setSelectedProgram('all');
        setSelectedProject('all');
        setSelectedTask('all');
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

    // Custom handler for tree node selection that updates filter state
    const handleTreeNodeSelect = (node: any, artefact?: Artefact) => {
        // Always update tree state
        treeState.selectNode(node, artefact);
        
        // Update filter state based on node type
        if (node.type === 'workstream') {
            const workstreamName = node.label;
            setSelectedWorkstream(workstreamName);
            setSelectedProgram('all');
            setSelectedProject('all');
            setSelectedTask('all');
        } else if (node.type === 'program') {
            // Extract program ID from tree node
            const programId = node.id.replace('prog-', '');
            setSelectedProgram(programId);
            setSelectedProject('all');
            setSelectedTask('all');
        } else if (node.type === 'project') {
            // Extract project ID from tree node
            const projectId = node.id.replace('proj-', '');
            setSelectedProject(projectId);
            setSelectedTask('all');
        }
        
        console.log('🌳 Tree node selected:', {
            nodeType: node.type,
            nodeId: node.id,
            nodeLabel: node.label,
            updatedFilters: node.type === 'project' ? { selectedProject: node.id.replace('proj-', '') } : 'other'
        });
    };

    // Node-based mutation handler for Task 11.3.3
    const handleArtefactMutation = async (artefact: Artefact, action: any) => {
        try {
            console.log(`🔧 Mutation triggered:`, {
                artefact: artefact.title,
                action: action.type,
                value: action.value
            });
            
            if (action.type === 'status') {
                // Update status optimistically
                const updatedArtefact = { ...artefact, status: action.value };
                
                // Optimistic update
                setOptimisticArtefacts(prev => 
                    prev.map(a => a.id === artefact.id ? updatedArtefact : a)
                );
                
                console.log(`✅ Status updated: ${artefact.title} → ${action.value}`);
            } else if (action.type === 'tag') {
                // Add tag optimistically
                const newTags = [...(artefact.tags || [])];
                if (!newTags.includes(action.value)) {
                    newTags.push(action.value);
                }
                const updatedArtefact = { ...artefact, tags: newTags };
                    
                    // Optimistic update
                    setOptimisticArtefacts(prev => 
                        prev.map(a => a.id === artefact.id ? updatedArtefact : a)
                    );
                    
                    console.log(`🏷️ Tag added: ${artefact.title} → ${action.value}`);
            } else if (action.type === 'edit') {
                // For edit, we'll trigger the existing edit flow
                setEditingTask(artefact);
                setAddingTask(false);
                console.log(`✏️ Edit triggered for: ${artefact.title}`);
                
            } else if (action.type === 'delete') {
                // For delete, we'll trigger the existing delete flow
                await handleDeleteTask(artefact);
                console.log(`🗑️ Delete triggered for: ${artefact.title}`);
                return; // Early return since handleDeleteTask handles its own updates
            }
            
            // Refresh data to get latest state
            if (action.type === 'status' || action.type === 'tag') {
                setTimeout(() => {
                    loadArtefacts();
                }, 500); // Small delay to allow for any backend processing
            }
            
        } catch (error) {
            console.error('❌ Mutation failed:', error);
            // Rollback optimistic update on error
            setOptimisticArtefacts(prev => 
                prev.map(a => a.id === artefact.id ? artefact : a)
            );
            throw error;
        }
    };

    // Expand/collapse handlers for unified artefact cards
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
                <h1 className="text-3xl font-bold">Workstream</h1>
                <p className="text-lg text-muted-foreground">
                    Hierarchical Tree Navigation + Roadmap-Driven Filtering: Workstream → Program → Project → Artefact Type → Status
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                    <span>Total: <strong>{optimisticArtefacts.length}</strong> artefacts</span>
                    <span>Filtered: <strong>{filteredArtefacts.length}</strong> shown</span>
                    <span>Workstreams: <strong>{availableWorkstreams.length - 1}</strong></span>
                    <span>Programs: <strong>{availablePrograms.length - 1}</strong> (roadmap)</span>
                    <span>Projects: <strong>{availableProjects.length - 1}</strong> (roadmap)</span>
                    <span>Tasks: <strong>{availableTasks.length - 1}</strong> (roadmap)</span>
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
                                    className="prose prose-lg max-w-none mt-6 
                                             prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-semibold
                                             prose-h1:text-3xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
                                             prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-gray-800
                                             prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-gray-700
                                             prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-gray-600
                                             prose-p:mb-4 prose-p:leading-relaxed
                                             prose-ul:space-y-2 prose-ol:space-y-2
                                             prose-li:mb-2 prose-li:leading-relaxed
                                             prose-strong:font-semibold prose-strong:text-gray-900
                                             prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                             prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg
                                             prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                                             prose-hr:my-8 prose-hr:border-gray-300
                                             prose-table:border prose-table:border-gray-200
                                             prose-th:bg-gray-50 prose-th:font-semibold prose-th:p-3 prose-th:border prose-th:border-gray-200
                                             prose-td:p-3 prose-td:border prose-td:border-gray-200"
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
                    <CardTitle>🏗️ Workstreams</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Hierarchical filtering based on roadmap.md structure: Workstream → Program → Project → Task → Artefact Type → Status
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-start">
                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
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

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                                <Target className="inline h-4 w-4 mr-1" />
                                Program (Phase)
                            </label>
                            <Select value={selectedProgram} onValueChange={handleProgramChange}>
                                <SelectTrigger>
                                    <SelectValue>
                                        {(() => {
                                            const selected = availablePrograms.find(p => p.id === selectedProgram);
                                            if (!selected) return 'Select Program...';
                                            const displayText = (selected as any).displayLabel || selected.fullName || selected.name;
                                            return displayText.length > 25 ? displayText.substring(0, 22) + '...' : displayText;
                                        })()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {availablePrograms.map(program => {
                                        const displayText = (program as any).displayLabel || program.fullName || program.name;
                                        const isLong = displayText.length > 35;
                                        const shortText = isLong ? displayText.substring(0, 32) + '...' : displayText;
                                        
                                        return (
                                            <SelectItem 
                                                key={program.id} 
                                                value={program.id}
                                                className={`py-3 px-3 hover:bg-gray-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                                                    program.id === 'all' ? 'bg-gray-50 font-bold' : ''
                                                }`}
                                            >
                                                <div className="flex flex-col items-start w-full space-y-1">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-semibold text-gray-900 leading-tight text-sm">
                                                            {shortText}
                                                        </span>
                                                        {program.status && program.id !== 'all' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                program.status === 'complete' ? 'bg-green-100 text-green-700' :
                                                                program.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {program.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLong && (
                                                        <span className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-gray-200">
                                                            {displayText}
                                                        </span>
                                                    )}
                                                </div>
                                        </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availablePrograms.length - 1} programs from roadmap.md
                            </p>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                                <Hash className="inline h-4 w-4 mr-1" />
                                Project
                            </label>
                            <Select value={selectedProject} onValueChange={handleProjectChange}>
                                <SelectTrigger>
                                    <SelectValue>
                                        {(() => {
                                            const selected = availableProjects.find(p => p.id === selectedProject);
                                            if (!selected) return 'Select Project...';
                                            const displayText = (selected as any).displayLabel || selected.fullName || selected.name;
                                            return displayText.length > 25 ? displayText.substring(0, 22) + '...' : displayText;
                                        })()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {availableProjects.map(project => {
                                        const displayText = (project as any).displayLabel || project.fullName || project.name;
                                        const isLong = displayText.length > 35;
                                        const shortText = isLong ? displayText.substring(0, 32) + '...' : displayText;
                                        
                                        return (
                                            <SelectItem 
                                                key={project.id} 
                                                value={project.id}
                                                className={`py-3 px-3 hover:bg-gray-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                                                    project.id === 'all' ? 'bg-gray-50 font-bold' : ''
                                                }`}
                                            >
                                                <div className="flex flex-col items-start w-full space-y-1">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-semibold text-gray-900 leading-tight text-sm">
                                                            {shortText}
                                                        </span>
                                                        {project.status && project.id !== 'all' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                project.status === 'complete' ? 'bg-green-100 text-green-700' :
                                                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {project.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLong && (
                                                        <span className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-gray-200">
                                                            {displayText}
                                                        </span>
                                                    )}
                                                </div>
                                        </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableProjects.length - 1} projects from roadmap.md
                            </p>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                                <CheckSquare className="inline h-4 w-4 mr-1" />
                                Task
                            </label>
                            <Select value={selectedTask} onValueChange={setSelectedTask}>
                                <SelectTrigger>
                                    <SelectValue>
                                        {(() => {
                                            const selected = availableTasks.find(t => t.id === selectedTask);
                                            if (!selected) return 'Select Task...';
                                            const displayText = (selected as any).displayLabel || selected.fullName || selected.name;
                                            return displayText.length > 25 ? displayText.substring(0, 22) + '...' : displayText;
                                        })()}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {availableTasks.map(task => {
                                        const displayText = (task as any).displayLabel || task.fullName || task.name;
                                        const isLong = displayText.length > 35;
                                        const shortText = isLong ? displayText.substring(0, 32) + '...' : displayText;
                                        
                                        return (
                                            <SelectItem 
                                                key={task.id} 
                                                value={task.id}
                                                className={`py-3 px-3 hover:bg-gray-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                                                    task.id === 'all' ? 'bg-gray-50 font-bold' : ''
                                                }`}
                                            >
                                                <div className="flex flex-col items-start w-full space-y-1">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-semibold text-gray-900 leading-tight text-sm">
                                                            {shortText}
                                                        </span>
                                                        {task.status && task.id !== 'all' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                task.status === 'complete' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {task.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isLong && (
                                                        <span className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-gray-200">
                                                            {displayText}
                                                        </span>
                                                    )}
                                                </div>
                                        </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {availableTasks.length - 1} tasks from roadmap.md
                            </p>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
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

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
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

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                                <RotateCcw className="inline h-4 w-4 mr-1" />
                                Actions
                            </label>
                            <Button 
                                variant="outline" 
                                onClick={clearAllFilters}
                                className="w-full h-9 flex items-center justify-center"
                            >
                                Clear All Filters
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">
                                Reset to defaults
                            </p>
                        </div>

                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                                <RefreshCw className="inline h-4 w-4 mr-1" />
                                Data
                            </label>
                            <Button 
                                variant="outline" 
                                onClick={loadArtefacts}
                                className="w-full h-9 flex items-center justify-center"
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
                            onNodeSelect={handleTreeNodeSelect}
                            selectedNodeId={treeState.selectedNode?.id}
                            validateArtefactAlignment={roadmapHierarchy.validateArtefactAlignment}
                            onArtefactMutate={handleArtefactMutation}
                            workstream={selectedWorkstream}
                        />
                    </div>

                    {/* Context Pane */}
                    <div className="lg:col-span-2">
                        <ContextPane
                            selectedNode={treeState.selectedNode || undefined}
                            selectedArtefact={treeState.selectedArtefact || undefined}
                            filteredArtefacts={filteredArtefacts}
                            onArtefactUpdate={(updatedArtefact) => {
                                // Handle artefact updates from ContextPane (e.g., chat mutations)
                                setOptimisticArtefacts(prev => 
                                    prev.map(a => a.id === updatedArtefact.id ? updatedArtefact : a)
                                );
                                // Refresh data to ensure consistency
                                setTimeout(() => loadArtefacts(), 500);
                            }}
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

            {/* Unified Artefact View */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>🎯 Unified Artefact View ({filteredArtefacts.length})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                                Expandable artefact cards with full content, sections, and integrated chat
                                {batchMode && ' - Batch mode enabled'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Expand/Collapse All Controls */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExpandAll}
                                    className="text-xs"
                                >
                                    Expand All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCollapseAll}
                                    className="text-xs"
                                >
                                    Collapse All
                                </Button>
                            </div>
                            
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
                                const isExpanded = expandedArtefacts.has(artefact.id);
                                
                                return (
                                    <div key={artefact.id} className="relative">
                                        <UnifiedArtefactCard
                                            artefact={artefact}
                                            isExpanded={isExpanded}
                                            onToggleExpand={(expanded) => handleToggleArtefactExpand(artefact.id, expanded)}
                                                onEdit={() => handleEditTask(artefact)}
                                                onDelete={() => handleDeleteTask(artefact)}
                                            onMutate={(action) => handleArtefactMutation(artefact, action)}
                                            showControls={!addingTask && !editingTask && !isPending && !batchMode}
                                                isPending={isPending}
                                                isFailed={isFailed}
                                            className={`transition-all duration-200 ${
                                                    isPending 
                                                    ? 'opacity-75 bg-yellow-50' 
                                                        : isFailed 
                                                        ? 'bg-red-50' 
                                                        : ''
                                                }`}
                                            />
                                        
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
                                <span> | {roadmapHierarchy.hierarchy.programs.length} programs, {roadmapHierarchy.hierarchy.projects.length} projects, {roadmapHierarchy.hierarchy.tasks.length} tasks</span>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 