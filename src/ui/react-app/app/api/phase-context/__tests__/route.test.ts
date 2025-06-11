import { GET } from '../route';
import { NextRequest } from 'next/server';

interface PhaseContext {
  phase: string;
  strategicFocus: string;
  keyObjectives: string[];
  currentChallenges: string[];
  successCriteria: string[];
  dependencies: string[];
  nextPhasePreparation: string;
}

// Mock fs module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import fs from 'fs/promises';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/phase-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (phase?: string) => {
    const url = phase 
      ? `http://localhost:3000/api/phase-context?phase=${phase}`
      : 'http://localhost:3000/api/phase-context';
    return new NextRequest(url);
  };

  const mockRoadmapWithContext = `---
title: Ora System Roadmap
---

### Phase 11: Artefact Hierarchy, Filtering & Chat

#### LLM Prompt Context
**Strategic Focus**: Establish unified artefact management foundation with semantic chat integration and intuitive navigation.

**Key Objectives**: 
- Canonicalize artefact schema for consistent data structure and taxonomy compliance
- Implement sophisticated filtering and mutation capabilities with optimistic UI patterns
- Enable contextual chat embedding throughout all artefact interactions
- Build interactive roadmap tree navigation for hierarchical data exploration

**Current Challenges**: 
- Legacy artefact files require schema alignment and metadata standardization
- Complex filtering dependencies across workstream/program/project/artefact hierarchy
- Performance optimization needed for real-time updates and batch operations

**Success Criteria**: 
- All artefacts follow canonical schema with complete taxonomy compliance
- Users can efficiently navigate, filter, and mutate artefacts with immediate feedback
- Contextual chat provides intelligent assistance within full artefact context
- Tree navigation enables intuitive exploration of entire system hierarchy

**Dependencies**: 
- Requires robust parsing infrastructure for roadmap.md as canonical source
- API layer must support optimistic updates with rollback capabilities
- Chat integration depends on reliable memory trace and context passing

**Next Phase Preparation**: Foundation for Phase 12 administration features and automated artefact lifecycle management.

### Phase 12: Administration & Governance

#### LLM Prompt Context
**Strategic Focus**: Establish robust administration, governance, and automated artefact lifecycle management.

**Key Objectives**: 
- Implement automated artefact file creation with bidirectional sync
- Build comprehensive admin UI for phases, projects, workstreams
- Establish ownership, permissions, and audit logging
- Create program/workstream context prompting for enhanced LLM integration

**Current Challenges**: 
- Manual artefact creation process creates bottlenecks and inconsistencies
- Lack of centralized administration interface limits operational efficiency
- No systematic approach to context-aware LLM prompting across the system

**Success Criteria**: 
- Fully automated artefact lifecycle from creation to sync and remediation
- Complete admin interface for all system configuration and user management
- Context-rich LLM interactions with deep program/phase awareness
- Comprehensive audit trails and permission systems operational

**Dependencies**: 
- Phase 11 artefact schema canonicalization and filtering infrastructure
- Robust API layer for administrative operations and bulk mutations
- Integration with existing chat and memory trace systems

**Next Phase Preparation**: Data quality foundation for Phase 13 audit and compliance capabilities.`;

  describe('successful responses', () => {
    it('should return phase context for valid phase number', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapWithContext);

      const request = createMockRequest('11');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      
      expect(data).toMatchObject({
        phase: 'Phase 11: Artefact Hierarchy, Filtering & Chat',
        strategicFocus: 'Establish unified artefact management foundation with semantic chat integration and intuitive navigation.',
        keyObjectives: [
          'Canonicalize artefact schema for consistent data structure and taxonomy compliance',
          'Implement sophisticated filtering and mutation capabilities with optimistic UI patterns',
          'Enable contextual chat embedding throughout all artefact interactions',
          'Build interactive roadmap tree navigation for hierarchical data exploration'
        ],
        currentChallenges: [
          'Legacy artefact files require schema alignment and metadata standardization',
          'Complex filtering dependencies across workstream/program/project/artefact hierarchy',
          'Performance optimization needed for real-time updates and batch operations'
        ],
        successCriteria: [
          'All artefacts follow canonical schema with complete taxonomy compliance',
          'Users can efficiently navigate, filter, and mutate artefacts with immediate feedback',
          'Contextual chat provides intelligent assistance within full artefact context',
          'Tree navigation enables intuitive exploration of entire system hierarchy'
        ],
        dependencies: [
          'Requires robust parsing infrastructure for roadmap.md as canonical source',
          'API layer must support optimistic updates with rollback capabilities',
          'Chat integration depends on reliable memory trace and context passing'
        ],
        nextPhasePreparation: 'Foundation for Phase 12 administration features and automated artefact lifecycle management.'
      });
    });

    it('should return phase context for phase 12', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapWithContext);

      const request = createMockRequest('12');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      
      expect(data.phase).toBe('Phase 12: Administration & Governance');
      expect(data.strategicFocus).toBe('Establish robust administration, governance, and automated artefact lifecycle management.');
      expect(data.keyObjectives).toContain('Implement automated artefact file creation with bidirectional sync');
      expect(data.keyObjectives).toContain('Build comprehensive admin UI for phases, projects, workstreams');
    });

    it('should handle phases with minimal context', async () => {
      const minimalRoadmap = `### Phase 13: Test Phase

#### LLM Prompt Context
**Strategic Focus**: Basic test phase.

**Key Objectives**: 
- Simple objective

**Current Challenges**: 
- Simple challenge

**Success Criteria**: 
- Simple criteria

**Dependencies**: 
- Simple dependency

**Next Phase Preparation**: Simple preparation.`;

      mockFs.readFile.mockResolvedValue(minimalRoadmap);

      const request = createMockRequest('13');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      expect(data.keyObjectives).toEqual(['Simple objective']);
      expect(data.currentChallenges).toEqual(['Simple challenge']);
      expect(data.successCriteria).toEqual(['Simple criteria']);
      expect(data.dependencies).toEqual(['Simple dependency']);
    });

    it('should handle phases with no list items gracefully', async () => {
      const noListsRoadmap = `### Phase 14: Empty Lists

#### LLM Prompt Context
**Strategic Focus**: Focus without lists.

**Key Objectives**: 

**Current Challenges**: 

**Success Criteria**: 

**Dependencies**: 

**Next Phase Preparation**: No preparation.`;

      mockFs.readFile.mockResolvedValue(noListsRoadmap);

      const request = createMockRequest('14');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      expect(data.keyObjectives).toEqual([]);
      expect(data.currentChallenges).toEqual([]);
      expect(data.successCriteria).toEqual([]);
      expect(data.dependencies).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 400 when phase parameter is missing', async () => {
      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Phase parameter is required');
    });

    it('should return 404 when phase is not found in roadmap', async () => {
      const roadmapWithoutPhase = `### Phase 11: Different Phase
      
#### LLM Prompt Context
**Strategic Focus**: Different focus.`;

      mockFs.readFile.mockResolvedValue(roadmapWithoutPhase);

      const request = createMockRequest('99');
      const response = await GET(request);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Context not found for phase: 99');
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const request = createMockRequest('11');
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Internal server error');
    });

    it('should handle malformed roadmap content', async () => {
      const malformedContent = 'This is not valid markdown';
      mockFs.readFile.mockResolvedValue(malformedContent);

      const request = createMockRequest('11');
      const response = await GET(request);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Context not found for phase: 11');
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('EACCES: permission denied');
      (permissionError as any).code = 'EACCES';
      mockFs.readFile.mockRejectedValue(permissionError);

      const request = createMockRequest('11');
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('response format validation', () => {
    it('should return objects with all required PhaseContext fields', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapWithContext);

      const request = createMockRequest('11');
      const response = await GET(request);

      const data: PhaseContext = await response.json();
      
      expect(data).toHaveProperty('phase');
      expect(data).toHaveProperty('strategicFocus');
      expect(data).toHaveProperty('keyObjectives');
      expect(data).toHaveProperty('currentChallenges');
      expect(data).toHaveProperty('successCriteria');
      expect(data).toHaveProperty('dependencies');
      expect(data).toHaveProperty('nextPhasePreparation');
      
      expect(typeof data.phase).toBe('string');
      expect(typeof data.strategicFocus).toBe('string');
      expect(Array.isArray(data.keyObjectives)).toBe(true);
      expect(Array.isArray(data.currentChallenges)).toBe(true);
      expect(Array.isArray(data.successCriteria)).toBe(true);
      expect(Array.isArray(data.dependencies)).toBe(true);
      expect(typeof data.nextPhasePreparation).toBe('string');
    });

    it('should set correct content-type header', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapWithContext);

      const request = createMockRequest('11');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('edge cases', () => {
    it('should handle phases with special characters in lists', async () => {
      const specialCharRoadmap = `### Phase 15: Special Characters

#### LLM Prompt Context
**Strategic Focus**: Focus with special chars.

**Key Objectives**: 
- Objective with "quotes" and & symbols
- Objective with <tags> and [brackets]
- Objective with emojis 🚀 and unicode ñ

**Current Challenges**: 
- Challenge with 100% success rate
- Challenge with $cost variables

**Success Criteria**: 
- Criteria with multi-line
  continuation text
- Criteria with bullet •points

**Dependencies**: 
- Dependencies with URLs https://example.com
- Dependencies with code \`snippets\`

**Next Phase Preparation**: Preparation with special characters & symbols.`;

      mockFs.readFile.mockResolvedValue(specialCharRoadmap);

      const request = createMockRequest('15');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      expect(data.keyObjectives[0]).toBe('Objective with "quotes" and & symbols');
      expect(data.keyObjectives[1]).toBe('Objective with <tags> and [brackets]');
      expect(data.keyObjectives[2]).toBe('Objective with emojis 🚀 and unicode ñ');
    });

    it('should handle very long content', async () => {
      const longObjective = 'This is a very long objective that spans multiple lines and contains a lot of detail about what needs to be accomplished in this phase. '.repeat(10);
      
      const longContentRoadmap = `### Phase 16: Long Content

#### LLM Prompt Context
**Strategic Focus**: ${longObjective}

**Key Objectives**: 
- ${longObjective}
- Another objective

**Current Challenges**: 
- ${longObjective}

**Success Criteria**: 
- ${longObjective}

**Dependencies**: 
- ${longObjective}

**Next Phase Preparation**: ${longObjective}`;

      mockFs.readFile.mockResolvedValue(longContentRoadmap);

      const request = createMockRequest('16');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data: PhaseContext = await response.json();
      expect(data.strategicFocus.length).toBeGreaterThan(1000);
      expect(data.keyObjectives[0].length).toBeGreaterThan(1000);
    });

    it('should handle missing LLM Prompt Context section', async () => {
      const noContextRoadmap = `### Phase 17: No Context

Some regular content without LLM context.`;

      mockFs.readFile.mockResolvedValue(noContextRoadmap);

      const request = createMockRequest('17');
      const response = await GET(request);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Context not found for phase: 17');
    });
  });
}); 