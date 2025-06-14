/**
 * Roadmap Parser - Extracts canonical hierarchy from roadmap.md
 * 
 * This module parses the roadmap.md content to extract the canonical
 * structure of workstreams, programs (phases), and projects that should
 * be used as the source of truth for all filtering and navigation.
 */

export interface RoadmapProgram {
    id: string;
    name: string;                    // Short name without number (for fallback)
    fullName: string;               // Complete hierarchical label (for display)
    displayLabel: string;           // Formatted label for UI rendering
    phase: string;
    status: 'complete' | 'in_progress' | 'planning' | 'next' | 'planned';
    projects: RoadmapProject[];
    description?: string;
    startDate?: string;
    completionDate?: string;
    owner?: string;
}

export interface RoadmapProject {
    id: string;
    name: string;                    // Short name without number (for fallback)
    fullName: string;               // Complete hierarchical label (for display)
    displayLabel: string;           // Formatted label for UI rendering
    programId: string;
    status: 'complete' | 'in_progress' | 'planning' | 'next' | 'planned';
    tasks: RoadmapTask[];
    description?: string;
    startDate?: string;
    completionDate?: string;
}

export interface RoadmapTask {
    id: string;
    name: string;                    // Short name without number (for fallback)
    fullName: string;               // Complete hierarchical label (for display)
    displayLabel: string;           // Formatted label for UI rendering
    projectId: string;
    status: 'complete' | 'in_progress' | 'planning' | 'next' | 'planned';
    description?: string;
    startDate?: string;
    completionDate?: string;
    deliverable?: string;
    notes?: string;
}

export interface RoadmapHierarchy {
    workstreams: string[];
    programs: RoadmapProgram[];
    projects: RoadmapProject[];
    tasks: RoadmapTask[];
    lastUpdated: string;
}

/**
 * Utility functions for hierarchical label formatting
 */
export function formatProgramLabel(phaseNum: string, title: string): string {
    return `Phase ${phaseNum}: ${title}`;
}

export function formatProjectLabel(projectNum: string, title: string): string {
    return `Project ${projectNum}: ${title}`;
}

export function formatTaskLabel(taskNum: string, title: string): string {
    return `Task ${taskNum}: ${title}`;
}

/**
 * Get display label for any roadmap item
 */
export function getDisplayLabel(item: RoadmapProgram | RoadmapProject | RoadmapTask): string {
    return item.displayLabel || item.fullName || item.name;
}

/**
 * Create hierarchical context string for tooltips
 */
export function getHierarchicalContext(hierarchy: RoadmapHierarchy, item: RoadmapProject | RoadmapTask): string {
    if ('projectId' in item) {
        // This is a task
        const project = hierarchy.projects.find(p => p.id === item.projectId);
        const program = project ? hierarchy.programs.find(pr => pr.id === project.programId) : null;
        return `${program?.displayLabel || 'Unknown Phase'} → ${project?.displayLabel || 'Unknown Project'} → ${item.displayLabel}`;
    } else {
        // This is a project
        const program = hierarchy.programs.find(pr => pr.id === item.programId);
        return `${program?.displayLabel || 'Unknown Phase'} → ${item.displayLabel}`;
    }
}

/**
 * Parse roadmap.md content and extract hierarchical structure
 */
export function parseRoadmapContent(roadmapContent: string): RoadmapHierarchy {
    const lines = roadmapContent.split('\n');
    const programs: RoadmapProgram[] = [];
    const projects: RoadmapProject[] = [];
    const tasks: RoadmapTask[] = [];
    
    let currentProgram: RoadmapProgram | null = null;
    let currentProject: RoadmapProject | null = null;
    let inExpandedRoadmap = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Start of expanded roadmap section - handle both HTML and markdown
        if (line.includes('Expanded System Roadmap') || 
            line.match(/<h2[^>]*>.*?Expanded System Roadmap.*?<\/h2>/)) {
            inExpandedRoadmap = true;
            continue;
        }
        
        // End of expanded roadmap section - only exit at actual end sections  
        if (inExpandedRoadmap && (line.startsWith('## Change Log') || 
                                  line.startsWith('## Audit and Execution Logs') ||
                                  line.startsWith('# Change Log') ||
                                  line.match(/<h2[^>]*>.*?(Change Log|Audit and Execution Logs).*?<\/h2>/) ||
                                  line.match(/<h1[^>]*>.*?(Change Log|Audit and Execution Logs).*?<\/h1>/))) {
            inExpandedRoadmap = false;
            continue;
        }
        
        if (!inExpandedRoadmap) continue;
        
        // Parse Phase headers (Programs) - handle HTML rendered content
        const htmlPhasePattern = /<h3[^>]*>Phase\s+(\d+(?:\.\d+)?):?\s*(.+?)<\/h3>/;
        const mdPhasePattern = /^###\s+Phase\s+(\d+(?:\.\d+)?):?\s*(.+)$/;
        
        const htmlPhaseMatch = line.match(htmlPhasePattern);
        const mdPhaseMatch = line.match(mdPhasePattern);
        
        const phaseMatch = htmlPhaseMatch || mdPhaseMatch;
        if (phaseMatch) {
            const [, phaseNum, title] = phaseMatch;
            // Clean HTML entities and tags from title
            const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const programId = `phase-${phaseNum}`;
            const programFullName = formatProgramLabel(phaseNum, cleanTitle);
            
            currentProgram = {
                id: programId,
                name: cleanTitle,                    // Clean title without phase number
                fullName: programFullName,           // Full hierarchical label  
                displayLabel: programFullName,       // Same as fullName for programs
                phase: phaseNum,
                status: 'planning',
                projects: [],
                description: cleanTitle
            };
            programs.push(currentProgram);
            continue;
        }
        
        // Parse Project headers - handle HTML rendered content
        const projectMatch = line.match(/<li[^>]*>.*?Project\s+(\d+(?:\.\d+)*):?\s*(.+?)</) ||
                            line.match(/^\s*-\s+Project\s+(\d+(?:\.\d+)*):?\s*(.+)$/);
        if (projectMatch && currentProgram) {
            const [, projectNum, title] = projectMatch;
            // Clean HTML entities and tags from title
            const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const projectId = `project-${projectNum}`;
            const projectFullName = formatProjectLabel(projectNum, cleanTitle);
            
            currentProject = {
                id: projectId,
                name: cleanTitle,                    // Clean title without project number
                fullName: projectFullName,           // Full hierarchical label
                displayLabel: projectFullName,       // Same as fullName for projects
                programId: currentProgram.id,
                status: 'planning',
                tasks: [],
                description: cleanTitle
            };
            
            projects.push(currentProject);
            currentProgram.projects.push(currentProject);
            continue;
        }
        
        // Parse Task headers - handle HTML rendered content
        const taskMatch = line.match(/<li[^>]*>.*?Task\s+(\d+(?:\.\d+)*(?:\.\d+)*):?\s*(.+?)</) ||
                         line.match(/^\s*-\s+Task\s+(\d+(?:\.\d+)*(?:\.\d+)*):?\s*(.+)$/);
        if (taskMatch && currentProject) {
            const [, taskNum, title] = taskMatch;
            // Clean HTML entities and tags from title
            const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const taskId = `task-${taskNum}`;
            const taskFullName = formatTaskLabel(taskNum, cleanTitle);
            
            const task: RoadmapTask = {
                id: taskId,
                name: cleanTitle,                    // Clean title without task number
                fullName: taskFullName,              // Full hierarchical label
                displayLabel: taskFullName,          // Same as fullName for tasks
                projectId: currentProject.id,
                status: 'planning',
                description: cleanTitle
            };
            
            tasks.push(task);
            currentProject.tasks.push(task);
            continue;
        }
    }
    
    // Parse detailed status sections for more accurate status and metadata
    parseDetailedSections(roadmapContent, programs, projects, tasks);
    
    return {
        workstreams: ['Ora'], // Default canonical workstream
        programs,
        projects,
        tasks,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Parse detailed sections for status, dates, and metadata
 */
function parseDetailedSections(
    content: string, 
    programs: RoadmapProgram[], 
    projects: RoadmapProject[], 
    tasks: RoadmapTask[]
): void {
    const lines = content.split('\n');
    let currentSection: 'program' | 'project' | 'task' | null = null;
    let currentItem: RoadmapProgram | RoadmapProject | RoadmapTask | null = null;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Detect section types
        if (trimmed.startsWith('### Project ') && trimmed.includes(':')) {
            currentSection = 'project';
            const projectMatch = trimmed.match(/### Project ([\d.]+):/);
            if (projectMatch) {
                currentItem = projects.find(p => p.id === `project-${projectMatch[1]}`) || null;
            }
            continue;
        }
        
        if (trimmed.startsWith('#### Task ') && trimmed.includes(':')) {
            currentSection = 'task';
            const taskMatch = trimmed.match(/#### Task ([\d.]+):/);
            if (taskMatch) {
                currentItem = tasks.find(t => t.id === `task-${taskMatch[1]}`) || null;
            }
            continue;
        }
        
        // Parse status
        if (trimmed.startsWith('**Status**:') && currentItem) {
            const statusMatch = trimmed.match(/\*\*Status\*\*:\s*(.+)/);
            if (statusMatch) {
                const statusText = statusMatch[1].toLowerCase();
                if (statusText.includes('complete')) {
                    currentItem.status = 'complete';
                } else if (statusText.includes('in progress') || statusText.includes('in_progress')) {
                    currentItem.status = 'in_progress';
                } else if (statusText.includes('next')) {
                    currentItem.status = 'next';
                } else if (statusText.includes('planned')) {
                    currentItem.status = 'planned';
                } else {
                    currentItem.status = 'planning';
                }
            }
        }
        
        // Parse completion date
        if (trimmed.startsWith('**Completion Date**:') && currentItem) {
            const dateMatch = trimmed.match(/\*\*Completion Date\*\*:\s*(.+)/);
            if (dateMatch) {
                currentItem.completionDate = dateMatch[1];
            }
        }
        
        // Parse start date
        if (trimmed.startsWith('**Start Date**:') && currentItem) {
            const dateMatch = trimmed.match(/\*\*Start Date\*\*:\s*(.+)/);
            if (dateMatch) {
                currentItem.startDate = dateMatch[1];
            }
        }
    }
}

/**
 * Get all programs for a specific workstream
 */
export function getProgramsForWorkstream(hierarchy: RoadmapHierarchy, workstream: string): RoadmapProgram[] {
    // For now, all programs belong to 'Ora' workstream
    if (workstream === 'all' || workstream === 'Ora') {
        return hierarchy.programs;
    }
    return [];
}

/**
 * Get all projects for a specific program
 */
export function getProjectsForProgram(hierarchy: RoadmapHierarchy, programId: string): RoadmapProject[] {
    if (programId === 'all') {
        return hierarchy.projects;
    }
    
    return hierarchy.projects.filter(project => project.programId === programId);
}

/**
 * Find program by phase number or full name
 */
export function findProgramByPhase(hierarchy: RoadmapHierarchy, phase: string): RoadmapProgram | null {
    return hierarchy.programs.find(program => 
        program.phase === phase || 
        program.phase === phase.split('.')[0] || // Handle sub-phases like "11.1" → "11"
        phase.startsWith(program.phase + '.') || // Handle hierarchical matching like "11.2.3" → "11"
        program.fullName.includes(`Phase ${phase}`) ||
        program.id === `phase-${phase}`
    ) || null;
}

/**
 * Find project by name or ID
 */
export function findProjectByName(hierarchy: RoadmapHierarchy, name: string): RoadmapProject | null {
    return hierarchy.projects.find(project => 
        project.name.toLowerCase().includes(name.toLowerCase()) ||
        project.fullName.toLowerCase().includes(name.toLowerCase()) ||
        project.id === name
    ) || null;
}

/**
 * Validate if an artefact references valid roadmap entries
 */
export function validateArtefactRoadmapAlignment(
    hierarchy: RoadmapHierarchy,
    artefact: {
        phase?: string;
        program?: string;
        tags?: string[];
    }
): {
    isValid: boolean;
    validProgram: RoadmapProgram | null;
    validProjects: RoadmapProject[];
    orphanTags: string[];
} {
    let validProgram: RoadmapProgram | null = null;
    let validProjects: RoadmapProject[] = [];
    let orphanTags: string[] = [];
    
    // Check program/phase alignment
    if (artefact.phase) {
        validProgram = findProgramByPhase(hierarchy, artefact.phase);
    }
    if (!validProgram && artefact.program) {
        validProgram = hierarchy.programs.find(p => 
            p.fullName === artefact.program || 
            p.name === artefact.program
        ) || null;
    }
    
    // Check project alignment via tags
    if (artefact.tags && artefact.tags.length > 0) {
        for (const tag of artefact.tags) {
            const project = findProjectByName(hierarchy, tag);
            if (project) {
                // Only add if project belongs to the valid program
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
    
    const isValid = validProgram !== null;
    
    return {
        isValid,
        validProgram,
        validProjects,
        orphanTags
    };
} 