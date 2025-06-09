/**
 * Test suite for hierarchical label rendering
 * 
 * This test suite validates that all UI components display the full
 * hierarchical labels from roadmap.md, including phase/project numbers.
 */

import { describe, test, expect } from '@jest/globals';
import { parseRoadmapContent, formatProgramLabel, formatProjectLabel, formatTaskLabel, getDisplayLabel, getHierarchicalContext } from '../roadmapParser';

// Sample roadmap content for testing
const sampleRoadmapContent = `
# Ora Roadmap

## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Artefact Hierarchy, Filtering & Chat
  - Project 11.1: Artefact Schema Canonicalization
      - Task 11.1.1: Design canonical artefact schema
      - Task 11.1.2: Document schema in system docs
  - Project 11.2: Filtering, Mutation, Semantic Chat
      - Task 11.2.1: Filtering Logic
      - Task 11.2.2: Inline Task Mutation
      - Task 11.2.3: Optimistic UI
  - Project 11.3: Interactive Roadmap Tree Navigation
      - Task 11.3.1: Tree Component/Sidebar
      - Task 11.3.2: In-situ Chat & Memory Trace in Tree

### Phase 12: Administration & Governance
  - Project 12.1: Admin UI (Phases, Projects, Artefacts)
      - Task 12.1.1: Admin page for managing phases/programs
      - Task 12.1.2: Project/artefact CRUD, grouping, archiving
  - Project 12.2: Ownership, Permissions, and Audit Logs
      - Task 12.2.1: Role management and user assignment

## Status

Phase 11 continues...
`;

describe('Roadmap Parser - Hierarchical Labels', () => {
    test('should parse programs with full hierarchical labels', () => {
        const hierarchy = parseRoadmapContent(sampleRoadmapContent);
        
        expect(hierarchy.programs.length).toBeGreaterThan(0);
        
        const phase11 = hierarchy.programs.find(p => p.phase === '11');
        expect(phase11).toBeDefined();
        expect(phase11?.fullName).toBe('Phase 11: Artefact Hierarchy, Filtering & Chat');
        expect(phase11?.displayLabel).toBe('Phase 11: Artefact Hierarchy, Filtering & Chat');
        expect(phase11?.name).toBe('Artefact Hierarchy, Filtering & Chat'); // Clean name without number
        
        const phase12 = hierarchy.programs.find(p => p.phase === '12');
        expect(phase12).toBeDefined();
        expect(phase12?.fullName).toBe('Phase 12: Administration & Governance');
        expect(phase12?.displayLabel).toBe('Phase 12: Administration & Governance');
        expect(phase12?.name).toBe('Administration & Governance');
    });

    test('should parse projects with full hierarchical labels', () => {
        const hierarchy = parseRoadmapContent(sampleRoadmapContent);
        
        expect(hierarchy.projects.length).toBeGreaterThan(0);
        
        const project111 = hierarchy.projects.find(p => p.id === 'project-11.1');
        expect(project111).toBeDefined();
        expect(project111?.fullName).toBe('Project 11.1: Artefact Schema Canonicalization');
        expect(project111?.displayLabel).toBe('Project 11.1: Artefact Schema Canonicalization');
        expect(project111?.name).toBe('Artefact Schema Canonicalization');
        
        const project112 = hierarchy.projects.find(p => p.id === 'project-11.2');
        expect(project112).toBeDefined();
        expect(project112?.fullName).toBe('Project 11.2: Filtering, Mutation, Semantic Chat');
        expect(project112?.displayLabel).toBe('Project 11.2: Filtering, Mutation, Semantic Chat');
        expect(project112?.name).toBe('Filtering, Mutation, Semantic Chat');
    });

    test('should parse tasks with full hierarchical labels', () => {
        const hierarchy = parseRoadmapContent(sampleRoadmapContent);
        
        expect(hierarchy.tasks.length).toBeGreaterThan(0);
        
        const task1111 = hierarchy.tasks.find(t => t.id === 'task-11.1.1');
        expect(task1111).toBeDefined();
        expect(task1111?.fullName).toBe('Task 11.1.1: Design canonical artefact schema');
        expect(task1111?.displayLabel).toBe('Task 11.1.1: Design canonical artefact schema');
        expect(task1111?.name).toBe('Design canonical artefact schema');
        
        const task1121 = hierarchy.tasks.find(t => t.id === 'task-11.2.1');
        expect(task1121).toBeDefined();
        expect(task1121?.fullName).toBe('Task 11.2.1: Filtering Logic');
        expect(task1121?.displayLabel).toBe('Task 11.2.1: Filtering Logic');
        expect(task1121?.name).toBe('Filtering Logic');
    });
});

describe('Label Formatting Functions', () => {
    test('formatProgramLabel should create consistent phase labels', () => {
        expect(formatProgramLabel('11', 'Artefact Hierarchy, Filtering & Chat'))
            .toBe('Phase 11: Artefact Hierarchy, Filtering & Chat');
        
        expect(formatProgramLabel('12.1', 'Sub-phase Example'))
            .toBe('Phase 12.1: Sub-phase Example');
    });

    test('formatProjectLabel should create consistent project labels', () => {
        expect(formatProjectLabel('11.1', 'Artefact Schema Canonicalization'))
            .toBe('Project 11.1: Artefact Schema Canonicalization');
        
        expect(formatProjectLabel('12.3', 'Workstream Structure Management'))
            .toBe('Project 12.3: Workstream Structure Management');
    });

    test('formatTaskLabel should create consistent task labels', () => {
        expect(formatTaskLabel('11.1.1', 'Design canonical artefact schema'))
            .toBe('Task 11.1.1: Design canonical artefact schema');
        
        expect(formatTaskLabel('11.2.3.1', 'Nested task example'))
            .toBe('Task 11.2.3.1: Nested task example');
    });
});

describe('Display Label Utilities', () => {
    test('getDisplayLabel should return hierarchical labels consistently', () => {
        const hierarchy = parseRoadmapContent(sampleRoadmapContent);
        
        const program = hierarchy.programs[0];
        const displayLabel = getDisplayLabel(program);
        expect(displayLabel).toBe(program.displayLabel);
        expect(displayLabel).toContain('Phase');
        expect(displayLabel).toContain(':');
        
        const project = hierarchy.projects[0];
        const projectDisplayLabel = getDisplayLabel(project);
        expect(projectDisplayLabel).toBe(project.displayLabel);
        expect(projectDisplayLabel).toContain('Project');
        expect(projectDisplayLabel).toContain(':');
    });

    test('getHierarchicalContext should create proper breadcrumbs', () => {
        const hierarchy = parseRoadmapContent(sampleRoadmapContent);
        
        const project = hierarchy.projects.find(p => p.id === 'project-11.1');
        const task = hierarchy.tasks.find(t => t.id === 'task-11.1.1');
        
        expect(project).toBeDefined();
        expect(task).toBeDefined();
        
        if (project && task) {
            const projectContext = getHierarchicalContext(hierarchy, project);
            expect(projectContext).toContain('Phase 11:');
            expect(projectContext).toContain('Project 11.1:');
            expect(projectContext).toContain('→');
            
            const taskContext = getHierarchicalContext(hierarchy, task);
            expect(taskContext).toContain('Phase 11:');
            expect(taskContext).toContain('Project 11.1:');
            expect(taskContext).toContain('Task 11.1.1:');
            expect(taskContext.split('→')).toHaveLength(3); // Phase → Project → Task
        }
    });
});

describe('Edge Cases and Deep Hierarchies', () => {
    test('should handle similar names with different numbers', () => {
        const complexRoadmap = `
## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Testing Phase
  - Project 11.1: Testing Project Alpha
      - Task 11.1.1: Testing Task One
  - Project 11.11: Testing Project Beta  
      - Task 11.11.1: Testing Task Eleven

### Phase 111: Another Testing Phase
  - Project 111.1: Another Testing Project
      - Task 111.1.1: Another Testing Task
`;
        
        const hierarchy = parseRoadmapContent(complexRoadmap);
        
        // Check that all items have unique, correctly formatted labels
        const phase11 = hierarchy.programs.find(p => p.phase === '11');
        const phase111 = hierarchy.programs.find(p => p.phase === '111');
        
        expect(phase11?.displayLabel).toBe('Phase 11: Testing Phase');
        expect(phase111?.displayLabel).toBe('Phase 111: Another Testing Phase');
        
        const project111 = hierarchy.projects.find(p => p.id === 'project-11.1');
        const project1111 = hierarchy.projects.find(p => p.id === 'project-11.11');
        const project111_1 = hierarchy.projects.find(p => p.id === 'project-111.1');
        
        expect(project111?.displayLabel).toBe('Project 11.1: Testing Project Alpha');
        expect(project1111?.displayLabel).toBe('Project 11.11: Testing Project Beta');
        expect(project111_1?.displayLabel).toBe('Project 111.1: Another Testing Project');
    });

    test('should handle deep task hierarchies', () => {
        const deepRoadmap = `
## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Deep Testing
  - Project 11.1: Deep Project
      - Task 11.1.1: Level One Task
      - Task 11.1.1.1: Level Two Task
      - Task 11.1.1.1.1: Level Three Task
`;
        
        const hierarchy = parseRoadmapContent(deepRoadmap);
        
        const task111 = hierarchy.tasks.find(t => t.id === 'task-11.1.1');
        const task1111 = hierarchy.tasks.find(t => t.id === 'task-11.1.1.1');
        const task11111 = hierarchy.tasks.find(t => t.id === 'task-11.1.1.1.1');
        
        expect(task111?.displayLabel).toBe('Task 11.1.1: Level One Task');
        expect(task1111?.displayLabel).toBe('Task 11.1.1.1: Level Two Task');
        expect(task11111?.displayLabel).toBe('Task 11.1.1.1.1: Level Three Task');
    });
});

describe('Label Consistency Across Formats', () => {
    test('should produce identical labels regardless of input whitespace', () => {
        const roadmap1 = `### Phase 11: Clean Format\n  - Project 11.1: Clean Project`;
        const roadmap2 = `###    Phase 11:     Clean Format   \n    -    Project 11.1:    Clean Project   `;
        
        const hierarchy1 = parseRoadmapContent(roadmap1);
        const hierarchy2 = parseRoadmapContent(roadmap2);
        
        expect(hierarchy1.programs[0]?.displayLabel).toBe(hierarchy2.programs[0]?.displayLabel);
        expect(hierarchy1.projects[0]?.displayLabel).toBe(hierarchy2.projects[0]?.displayLabel);
    });

    test('should handle special characters in titles correctly', () => {
        const specialRoadmap = `
## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Testing & Validation (Special Characters)
  - Project 11.1: UI/UX Design & Implementation
      - Task 11.1.1: Design wireframes & prototypes
`;
        
        const hierarchy = parseRoadmapContent(specialRoadmap);
        
        const program = hierarchy.programs[0];
        const project = hierarchy.projects[0];
        const task = hierarchy.tasks[0];
        
        expect(program?.displayLabel).toBe('Phase 11: Testing & Validation (Special Characters)');
        expect(project?.displayLabel).toBe('Project 11.1: UI/UX Design & Implementation');
        expect(task?.displayLabel).toBe('Task 11.1.1: Design wireframes & prototypes');
    });
}); 