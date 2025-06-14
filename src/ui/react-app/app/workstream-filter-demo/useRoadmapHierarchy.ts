import { useState, useEffect, useMemo } from 'react';
import { parseRoadmapContent, RoadmapHierarchy, getProgramsForWorkstream, getProjectsForProgram } from './roadmapParser';

export interface UseRoadmapHierarchyReturn {
    hierarchy: RoadmapHierarchy | null;
    loading: boolean;
    isLoading: boolean; // Alias for backwards compatibility
    error: string | null;
    refreshHierarchy: () => Promise<void>;
    
    // Convenience methods
    getAvailableWorkstreams: () => string[];
    getAvailablePrograms: (workstream: string) => { id: string; name: string; fullName: string; displayLabel: string; status: string }[];
    getAvailableProjects: (programId: string) => { id: string; name: string; fullName: string; displayLabel: string; status: string }[];
    validateArtefactAlignment: (artefact: any) => {
        isValid: boolean;
        validProgram: any;
        validProjects: any[];
        orphanTags: string[];
    };
}

export default function useRoadmapHierarchy(): UseRoadmapHierarchyReturn {
    const [hierarchy, setHierarchy] = useState<RoadmapHierarchy | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRoadmapHierarchy = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Add cache busting timestamp
            const timestamp = Date.now();
            const response = await fetch(`/api/system-docs?file=roadmap.md&t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load roadmap: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.selectedFile && data.selectedFile.rawContent) {
                const parsedHierarchy = parseRoadmapContent(data.selectedFile.rawContent);
                setHierarchy(parsedHierarchy);
            } else {
                throw new Error('No roadmap content found');
            }
        } catch (err) {
            console.error('Error loading roadmap hierarchy:', err);
            setError(err instanceof Error ? err.message : 'Failed to load roadmap hierarchy');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoadmapHierarchy();
    }, []);

    const getAvailableWorkstreams = useMemo(() => {
        return () => {
            if (!hierarchy) return ['all'];
            return ['all', ...hierarchy.workstreams];
        };
    }, [hierarchy]);

    const getAvailablePrograms = useMemo(() => {
        return (workstream: string) => {
            if (!hierarchy) return [];
            
            const programs = getProgramsForWorkstream(hierarchy, workstream);
            return programs.map(program => ({
                id: program.id,
                name: program.name,
                fullName: program.fullName,
                displayLabel: program.displayLabel,
                status: program.status
            }));
        };
    }, [hierarchy]);

    const getAvailableProjects = useMemo(() => {
        return (programId: string) => {
            if (!hierarchy) {
                return [];
            }
            
            const projects = getProjectsForProgram(hierarchy, programId);
            
            const result = projects.map(project => ({
                id: project.id,
                name: project.name,
                fullName: project.fullName,
                displayLabel: project.displayLabel,
                status: project.status
            }));
            
            return result;
        };
    }, [hierarchy]);

    const validateArtefactAlignment = useMemo(() => {
        return (artefact: any) => {
            if (!hierarchy) {
                return {
                    isValid: false,
                    validProgram: null,
                    validProjects: [],
                    orphanTags: artefact.tags || []
                };
            }
            
            // Find valid program by phase or program field
            let validProgram = null;
            if (artefact.phase) {
                // Ensure phase is converted to string for safe string operations
                const phaseStr = String(artefact.phase);
                validProgram = hierarchy.programs.find(p => 
                    p.phase === phaseStr ||
                    p.phase === phaseStr.split('.')[0] || // Handle sub-phases like "11.1" → "11"
                    phaseStr.startsWith(p.phase + '.') // Handle hierarchical matching like "11.2.3" → "11"
                );
            }
            if (!validProgram && artefact.program) {
                validProgram = hierarchy.programs.find(p => 
                    p.fullName === artefact.program || 
                    p.name === artefact.program
                );
            }
            
            // Find valid projects from tags
            let validProjects: any[] = [];
            let orphanTags: string[] = [];
            
            if (artefact.tags && Array.isArray(artefact.tags)) {
                for (const tag of artefact.tags) {
                    const project = hierarchy.projects.find(p => 
                        p.name.toLowerCase().includes(tag.toLowerCase()) ||
                        p.fullName.toLowerCase().includes(tag.toLowerCase())
                    );
                    
                    if (project) {
                        // Check if project belongs to valid program
                        if (!validProgram || project.programId === validProgram.id) {
                            validProjects.push(project);
                        } else {
                            orphanTags.push(tag);
                        }
                    } else {
                        orphanTags.push(tag);
                    }
                }
            }
            
            return {
                isValid: validProgram !== null,
                validProgram,
                validProjects,
                orphanTags
            };
        };
    }, [hierarchy]);

    return {
        hierarchy,
        loading,
        isLoading: loading, // Alias for backwards compatibility
        error,
        refreshHierarchy: loadRoadmapHierarchy,
        getAvailableWorkstreams,
        getAvailablePrograms,
        getAvailableProjects,
        validateArtefactAlignment
    };
} 