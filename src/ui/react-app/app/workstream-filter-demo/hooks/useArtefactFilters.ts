import { useState, useMemo, useCallback } from 'react';
import { Artefact } from './useArtefacts';
import useRoadmapHierarchy from '../useRoadmapHierarchy';

export interface FilterState {
    workstream: string;
    program: string;
    project: string;
    task: string;
    artefactType: string;
    status: string;
}

export interface FilterOptions {
    workstreams: string[];
    programs: Array<{ id: string; name: string; fullName: string; status: string }>;
    projects: Array<{ id: string; name: string; fullName: string; status: string }>;
    tasks: Array<{ id: string; name: string; fullName: string; status: string }>;
    artefactTypes: string[];
    statuses: string[];
}

export interface UseArtefactFiltersReturn {
    filters: FilterState;
    filteredArtefacts: Artefact[];
    filterOptions: FilterOptions;
    updateFilter: (key: keyof FilterState, value: string) => void;
    clearAllFilters: () => void;
    getStatusColor: (status: string) => string;
}

const CANONICAL_ARTEFACT_TYPES = [
    'task', 'note', 'thought', 'execution', 'loop'
];

export function useArtefactFilters(artefacts: Artefact[]): UseArtefactFiltersReturn {
    const roadmapHierarchy = useRoadmapHierarchy();
    
    const [filters, setFilters] = useState<FilterState>({
        workstream: 'ora',
        program: 'all',
        project: 'all',
        task: 'all',
        artefactType: 'all',
        status: 'all'
    });

    // Compute filter options based on roadmap hierarchy
    const filterOptions = useMemo((): FilterOptions => {
        const workstreams = roadmapHierarchy.loading || !roadmapHierarchy.hierarchy 
            ? ['all', 'ora'] 
            : roadmapHierarchy.getAvailableWorkstreams();

        const programs = roadmapHierarchy.loading || !roadmapHierarchy.hierarchy 
            ? [] 
            : [
                { id: 'all', name: 'All Programs', fullName: 'All Programs', status: 'all' },
                ...roadmapHierarchy.getAvailablePrograms(filters.workstream)
            ];

        const projects = roadmapHierarchy.loading || !roadmapHierarchy.hierarchy 
            ? [] 
            : (() => {
                let selectedProgramId = filters.program;
                if (filters.program !== 'all') {
                    const program = roadmapHierarchy.hierarchy.programs.find(p => 
                        p.fullName === filters.program || p.id === filters.program || p.name === filters.program
                    );
                    selectedProgramId = program ? program.id : filters.program;
                }
                
                const roadmapProjects = roadmapHierarchy.getAvailableProjects(selectedProgramId);
                return [
                    { id: 'all', name: 'All Projects', fullName: 'All Projects', status: 'all' },
                    ...roadmapProjects
                ];
            })();

        const tasks = roadmapHierarchy.loading || !roadmapHierarchy.hierarchy 
            ? [] 
            : (() => {
                let selectedProjectId = filters.project;
                if (filters.project !== 'all') {
                    const project = roadmapHierarchy.hierarchy.projects.find(p => 
                        p.fullName === filters.project || p.id === filters.project || p.name === filters.project
                    );
                    selectedProjectId = project ? project.id : filters.project;
                }
                
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
                        status: task.status
                    }))
                ];
            })();

        const artefactTypes = (() => {
            const types = new Set<string>();
            artefacts.forEach(artefact => {
                const type = artefact.type && CANONICAL_ARTEFACT_TYPES.includes(artefact.type) 
                    ? artefact.type 
                    : 'task';
                types.add(type);
            });
            return ['all', ...Array.from(types).sort()];
        })();

        const statuses = (() => {
            const statusSet = new Set<string>();
            artefacts.forEach(artefact => {
                if (artefact.status) {
                    statusSet.add(artefact.status);
                }
            });
            return ['all', ...Array.from(statusSet).sort()];
        })();

        return {
            workstreams,
            programs,
            projects,
            tasks,
            artefactTypes,
            statuses
        };
    }, [artefacts, roadmapHierarchy.hierarchy, roadmapHierarchy.loading, filters.workstream, filters.program, filters.project]);

    // Apply all filters to artefacts
    const filteredArtefacts = useMemo(() => {
        let filtered = artefacts;

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
        if (filters.workstream !== 'all') {
            filtered = filtered.filter(artefact => 
                artefact.workstream.toLowerCase() === filters.workstream.toLowerCase()
            );
        }

        // Roadmap-driven program filtering
        if (filters.program !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedProgramData = roadmapHierarchy.hierarchy.programs.find(p => 
                p.id === filters.program || 
                p.fullName === filters.program ||
                p.name === filters.program
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
        if (filters.project !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedProjectData = roadmapHierarchy.hierarchy.projects.find(p => 
                p.id === filters.project || 
                p.fullName === filters.project ||
                p.name === filters.project
            );
            
            if (selectedProjectData) {
                filtered = filtered.filter(artefact => {
                    const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                    const projectAlignment = alignment.validProjects.some(proj => proj.id === selectedProjectData.id);
                    
                    const projectNumber = selectedProjectData.id.replace('project-', '');
                    const phaseNumber = projectNumber.split('.')[0];
                    
                    const titleMatch = artefact.title.toLowerCase().includes(projectNumber) ||
                                     artefact.title.toLowerCase().includes(selectedProjectData.name.toLowerCase());
                    
                    let phaseMatch = false;
                    if (artefact.phase) {
                        const artefactPhase = String(artefact.phase);
                        phaseMatch = artefactPhase === phaseNumber || artefactPhase === projectNumber;
                        
                        if (!phaseMatch && projectNumber.includes('.')) {
                            phaseMatch = artefactPhase.startsWith(projectNumber + '.');
                        }
                        
                        if (!phaseMatch && projectNumber && !projectNumber.includes('.')) {
                            phaseMatch = artefactPhase.startsWith(projectNumber + '.');
                        }
                    }
                    
                    const tagMatch = artefact.tags && artefact.tags.some(tag => 
                        tag.includes(projectNumber) ||
                        tag.toLowerCase().includes(selectedProjectData.name.toLowerCase())
                    );
                    
                    return projectAlignment || titleMatch || phaseMatch || tagMatch;
                });
            }
        }

        // Task filtering
        if (filters.task !== 'all' && roadmapHierarchy.hierarchy) {
            const selectedTaskData = roadmapHierarchy.hierarchy.tasks.find(t => 
                t.id === filters.task || 
                t.fullName === filters.task ||
                t.name === filters.task
            );
            
            if (selectedTaskData) {
                const parentProject = roadmapHierarchy.hierarchy.projects.find(p => 
                    p.id === selectedTaskData.projectId
                );
                
                filtered = filtered.filter(artefact => {
                    const taskTitleMatch = artefact.title.toLowerCase().includes(selectedTaskData.name.toLowerCase());
                    const taskIdMatch = artefact.title.includes(selectedTaskData.id.replace('task-', ''));
                    
                    const taskTagMatch = artefact.tags && artefact.tags.some(tag => 
                        tag.toLowerCase().includes(selectedTaskData.name.toLowerCase()) ||
                        tag.includes(selectedTaskData.id.replace('task-', ''))
                    );
                    
                    let projectMatch = false;
                    if (parentProject) {
                        const projectTitleMatch = artefact.title.toLowerCase().includes(parentProject.name.toLowerCase());
                        const projectTagMatch = artefact.tags && artefact.tags.some(tag => 
                            tag.toLowerCase().includes(parentProject.name.toLowerCase())
                        );
                        projectMatch = projectTitleMatch || projectTagMatch;
                    }
                    
                    return taskTitleMatch || taskIdMatch || taskTagMatch || projectMatch;
                });
            }
        }

        // Artefact type filtering
        if (filters.artefactType !== 'all') {
            filtered = filtered.filter(artefact => artefact.type === filters.artefactType);
        }

        // Status filtering
        if (filters.status !== 'all') {
            filtered = filtered.filter(artefact => artefact.status === filters.status);
        }

        // Roadmap alignment validation
        if (roadmapHierarchy.hierarchy) {
            filtered = filtered.filter(artefact => {
                const alignment = roadmapHierarchy.validateArtefactAlignment(artefact);
                return alignment.isValid;
            });
        }

        return filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }, [artefacts, filters, roadmapHierarchy.hierarchy]);

    const updateFilter = useCallback((key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            
            // Reset cascade when parent selection changes
            if (key === 'workstream') {
                newFilters.program = 'all';
                newFilters.project = 'all';
                newFilters.task = 'all';
            } else if (key === 'program') {
                newFilters.project = 'all';
                newFilters.task = 'all';
            } else if (key === 'project') {
                newFilters.task = 'all';
            }
            
            return newFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            program: 'all',
            project: 'all',
            task: 'all',
            artefactType: 'all',
            status: 'all'
        }));
    }, []);

    const getStatusColor = useCallback((status: string) => {
        switch (status.toLowerCase()) {
            case 'complete': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    return {
        filters,
        filteredArtefacts,
        filterOptions,
        updateFilter,
        clearAllFilters,
        getStatusColor
    };
} 