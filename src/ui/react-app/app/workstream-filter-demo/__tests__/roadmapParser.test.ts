import { parseRoadmapContent, validateArtefactRoadmapAlignment, findProgramByPhase, findProjectByName } from '../roadmapParser';

const mockRoadmapContent = `
---
title: Ora System Roadmap
---

## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Artefact Hierarchy, Filtering & Chat
  - Project 11.1: Artefact Schema Canonicalization
      - Task 11.1.1: Design canonical artefact schema
      - Task 11.1.2: Document schema in system docs
  - Project 11.2: Filtering, Mutation, Semantic Chat
      - Task 11.2.1: Filtering Logic
      - Task 11.2.2: Inline Task Mutation
  - Project 11.3: Interactive Roadmap Tree Navigation
      - Task 11.3.1: Tree Component/Sidebar
      - Task 11.3.2: In-situ Chat & Memory Trace in Tree

### Phase 12: Administration & Governance
  - Project 12.1: Admin UI (Phases, Projects, Artefacts)
      - Task 12.1.1: Admin page for managing phases/programs
      - Task 12.1.2: Project/artefact CRUD, grouping, archiving

## Status

Phase 11: In Progress

### Project 11.3: Interactive Roadmap Tree Navigation
**Status**: IN PROGRESS
**Start Date**: 2025-12-15

#### Task 11.3.1: Tree Component/Sidebar
- **Status**: COMPLETE
- **Completion Date**: 2025-12-15
`;

describe('Roadmap Parser', () => {
    test('handles empty or malformed content gracefully', () => {
        const emptyHierarchy = parseRoadmapContent('');
        expect(emptyHierarchy.programs).toHaveLength(0);
        expect(emptyHierarchy.projects).toHaveLength(0);
        expect(emptyHierarchy.workstreams).toContain('Ora');
        
        const malformedHierarchy = parseRoadmapContent('Not a roadmap content');
        expect(malformedHierarchy.programs).toHaveLength(0);
        expect(malformedHierarchy.projects).toHaveLength(0);
    });

    test('basic roadmap structure parsing', () => {
        const simpleRoadmap = `
## Expanded System Roadmap

### Phase 11: Test Phase
  - Project 11.1: Test Project
      - Task 11.1.1: Test Task
`;
        
        const hierarchy = parseRoadmapContent(simpleRoadmap);
        expect(hierarchy.workstreams).toContain('Ora');
        expect(hierarchy.programs.length).toBeGreaterThan(0);
    });

    test('parseRoadmapContent extracts hierarchy correctly', () => {
        const hierarchy = parseRoadmapContent(mockRoadmapContent);
        
        expect(hierarchy.workstreams).toContain('Ora');
        expect(hierarchy.programs).toHaveLength(2);
        expect(hierarchy.projects).toHaveLength(4);
        
        // Check Phase 11 program
        const phase11 = hierarchy.programs.find(p => p.phase === '11');
        expect(phase11).toBeDefined();
        expect(phase11?.name).toBe('Artefact Hierarchy, Filtering & Chat');
        expect(phase11?.projects).toHaveLength(3);
        
        // Check Phase 12 program
        const phase12 = hierarchy.programs.find(p => p.phase === '12');
        expect(phase12).toBeDefined();
        expect(phase12?.name).toBe('Administration & Governance');
        expect(phase12?.projects).toHaveLength(1);
    });

    test('findProgramByPhase works correctly', () => {
        const hierarchy = parseRoadmapContent(mockRoadmapContent);
        
        const phase11 = findProgramByPhase(hierarchy, '11');
        expect(phase11).toBeDefined();
        expect(phase11?.phase).toBe('11');
        
        const nonExistent = findProgramByPhase(hierarchy, '99');
        expect(nonExistent).toBeNull();
    });

    test('findProjectByName works correctly', () => {
        const hierarchy = parseRoadmapContent(mockRoadmapContent);
        
        const project = findProjectByName(hierarchy, 'Interactive Roadmap');
        expect(project).toBeDefined();
        expect(project?.name).toContain('Interactive Roadmap Tree Navigation');
        
        const nonExistent = findProjectByName(hierarchy, 'Nonexistent Project');
        expect(nonExistent).toBeNull();
    });

    test('validateArtefactRoadmapAlignment works correctly', () => {
        const hierarchy = parseRoadmapContent(mockRoadmapContent);
        
        // Valid artefact aligned with Phase 11
        const validArtefact = {
            phase: '11',
            tags: ['Interactive Roadmap Tree Navigation']
        };
        
        const validResult = validateArtefactRoadmapAlignment(hierarchy, validArtefact);
        expect(validResult.isValid).toBe(true);
        expect(validResult.validProgram).toBeDefined();
        expect(validResult.validProjects).toHaveLength(1);
        expect(validResult.orphanTags).toHaveLength(0);
        
        // Invalid artefact with orphan tags
        const invalidArtefact = {
            phase: '99',
            tags: ['Nonexistent Project', 'Another Orphan']
        };
        
        const invalidResult = validateArtefactRoadmapAlignment(hierarchy, invalidArtefact);
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.validProgram).toBeNull();
        expect(invalidResult.orphanTags).toContain('Nonexistent Project');
        expect(invalidResult.orphanTags).toContain('Another Orphan');
    });

    test('parses detailed status sections correctly', () => {
        const hierarchy = parseRoadmapContent(mockRoadmapContent);
        
        const project113 = hierarchy.projects.find(p => 
            p.name.includes('Interactive Roadmap Tree Navigation')
        );
        expect(project113).toBeDefined();
        expect(project113?.status).toBe('in_progress');
        
        const task1131 = hierarchy.tasks.find(t => 
            t.name.includes('Tree Component/Sidebar')
        );
        expect(task1131).toBeDefined();
        expect(task1131?.status).toBe('complete');
    });
}); 