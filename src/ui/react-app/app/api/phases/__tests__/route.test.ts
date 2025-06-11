import { GET } from '../route';
import { NextRequest } from 'next/server';

interface PhaseInfo {
  id: string;
  number: string;
  title: string;
  fullTitle: string;
  status?: string;
}

// Mock fs module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

import fs from 'fs/promises';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/phases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (url = 'http://localhost:3000/api/phases') => {
    return new NextRequest(url);
  };

  const mockRoadmapContent = `---
title: Ora System Roadmap
created: 2025-06-08
last_updated: 2025-06-08
tags: [roadmap, phases, planning, documentation]
---

# Ora Roadmap

## Current Major Phases

1. **Phase 11:** Artefact Hierarchy and Filtering (Contextual-Chat-Demo UI)
2. **Phase 12:** Administration & Workstream Structure Management
3. **Phase 13:** Data Audit and Logical Grouping
4. **Phase 14+:** Semantic Feature Enhancements (tags, chat, scoring, sources, etc.)

## Expanded System Roadmap (Exploded Systems View)

### Phase 11: Artefact Hierarchy, Filtering & Chat

#### LLM Prompt Context
**Strategic Focus**: Establish unified artefact management foundation with semantic chat integration and intuitive navigation.

### Phase 12: Administration & Governance

#### LLM Prompt Context
**Strategic Focus**: Establish robust administration, governance, and automated artefact lifecycle management.

### Phase 13: Data Audit & Compliance

#### LLM Prompt Context
**Strategic Focus**: Ensure data integrity, compliance, and systematic management of legacy artefacts through comprehensive audit and remediation.

### Phase 14: Semantic/LLM Feature Enhancements

#### LLM Prompt Context
**Strategic Focus**: Leverage advanced AI and semantic technologies to enhance system intelligence, automation, and user experience through sophisticated LLM integration.`;

  describe('successful responses', () => {
    it('should return all phases from roadmap.md', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapContent);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(4);

      // Check phase 11
      const phase11 = data.find((p: PhaseInfo) => p.number === '11');
      expect(phase11).toMatchObject({
        id: 'phase-11',
        number: '11',
        title: 'Artefact Hierarchy, Filtering & Chat',
        fullTitle: 'Phase 11: Artefact Hierarchy, Filtering & Chat',
        status: 'active'
      });

      // Check phase 12
      const phase12 = data.find((p: PhaseInfo) => p.number === '12');
      expect(phase12).toMatchObject({
        id: 'phase-12',
        number: '12',
        title: 'Administration & Governance',
        fullTitle: 'Phase 12: Administration & Governance',
        status: 'active'
      });

      // Check phase 13
      const phase13 = data.find((p: PhaseInfo) => p.number === '13');
      expect(phase13).toMatchObject({
        id: 'phase-13',
        number: '13',
        title: 'Data Audit & Compliance',
        fullTitle: 'Phase 13: Data Audit & Compliance',
        status: 'active'
      });

      // Check phase 14
      const phase14 = data.find((p: PhaseInfo) => p.number === '14');
      expect(phase14).toMatchObject({
        id: 'phase-14',
        number: '14',
        title: 'Semantic/LLM Feature Enhancements',
        fullTitle: 'Phase 14: Semantic/LLM Feature Enhancements',
        status: 'active'
      });
    });

    it('should return phases sorted by number', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapContent);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Verify phases are sorted by number
      for (let i = 0; i < data.length - 1; i++) {
        const currentPhase = parseInt(data[i].number);
        const nextPhase = parseInt(data[i + 1].number);
        expect(currentPhase).toBeLessThan(nextPhase);
      }
    });

    it('should handle roadmap with no phases gracefully', async () => {
      const emptyRoadmap = `---
title: Empty Roadmap
---

# Empty Roadmap

No phases defined yet.`;

      mockFs.readFile.mockResolvedValue(emptyRoadmap);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle phases with complex titles containing special characters', async () => {
      const specialCharRoadmap = `### Phase 15: Advanced Features & Integration (Beta)

### Phase 16: Multi-Platform Support - Mobile & Desktop

### Phase 17: AI/ML Enhancement: Context-Aware Automation`;

      mockFs.readFile.mockResolvedValue(specialCharRoadmap);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      expect(data).toHaveLength(3);

      const phase15 = data.find((p: PhaseInfo) => p.number === '15');
      expect(phase15?.title).toBe('Advanced Features & Integration (Beta)');

      const phase16 = data.find((p: PhaseInfo) => p.number === '16');
      expect(phase16?.title).toBe('Multi-Platform Support - Mobile & Desktop');

      const phase17 = data.find((p: PhaseInfo) => p.number === '17');
      expect(phase17?.title).toBe('AI/ML Enhancement: Context-Aware Automation');
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Internal server error');
    });

    it('should handle malformed roadmap content', async () => {
      const malformedContent = 'This is not valid markdown with phases';
      mockFs.readFile.mockResolvedValue(malformedContent);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('EACCES: permission denied');
      (permissionError as any).code = 'EACCES';
      mockFs.readFile.mockRejectedValue(permissionError);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('response format validation', () => {
    it('should return objects with all required PhaseInfo fields', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapContent);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      data.forEach((phase: any) => {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('number');
        expect(phase).toHaveProperty('title');
        expect(phase).toHaveProperty('fullTitle');
        expect(phase).toHaveProperty('status');
        
        expect(typeof phase.id).toBe('string');
        expect(typeof phase.number).toBe('string');
        expect(typeof phase.title).toBe('string');
        expect(typeof phase.fullTitle).toBe('string');
        expect(typeof phase.status).toBe('string');
        
        expect(phase.id).toMatch(/^phase-\d+$/);
        expect(phase.fullTitle).toMatch(/^Phase \d+: .+$/);
      });
    });

    it('should set correct content-type header', async () => {
      mockFs.readFile.mockResolvedValue(mockRoadmapContent);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate phase numbers', async () => {
      const duplicatePhaseRoadmap = `### Phase 11: First Phase 11

### Phase 11: Second Phase 11

### Phase 12: Phase 12`;

      mockFs.readFile.mockResolvedValue(duplicatePhaseRoadmap);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      
      // Should include both phase 11 entries
      expect(data).toHaveLength(3);
      const phase11s = data.filter((p: any) => p.number === '11');
      expect(phase11s).toHaveLength(2);
    });

    it('should handle very large phase numbers', async () => {
      const largePhaseRoadmap = `### Phase 999: Large Phase Number

### Phase 1000: Very Large Phase Number`;

      mockFs.readFile.mockResolvedValue(largePhaseRoadmap);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      expect(data).toHaveLength(2);
      
      const phase999 = data.find((p: any) => p.number === '999');
      expect(phase999).toBeTruthy();
      
      const phase1000 = data.find((p: any) => p.number === '1000');
      expect(phase1000).toBeTruthy();
    });

    it('should handle empty phase titles', async () => {
      const emptyTitleRoadmap = `### Phase 20: 

### Phase 21:`;

      mockFs.readFile.mockResolvedValue(emptyTitleRoadmap);

      const request = createMockRequest();
      const response = await GET(request);

      const data = await response.json();
      expect(data).toHaveLength(2);
      
      data.forEach((phase: any) => {
        expect(phase.title).toBe('');
        expect(phase.fullTitle).toMatch(/^Phase \d+: $/);
      });
    });
  });
}); 