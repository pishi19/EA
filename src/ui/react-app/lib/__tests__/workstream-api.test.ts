import {
  generateWorkstreamChatResponse,
  buildWorkstreamLLMContext,
  validateWorkstreamAccess,
  getWorkstreamConfig,
  formatWorkstreamPath
} from '../workstream-api';

// Mock external dependencies
jest.mock('fs/promises', () => global.mockFs);

describe('Workstream API Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    global.mockFs.readFile.mockImplementation(async (path: string) => {
      if (path.includes('roadmap.md')) {
        return `# Ora Workstream Roadmap
        
## Phase 11: Artefact Hierarchy and Filtering
**Objectives:**
- Implement filtering capabilities
- Build interactive tree navigation

**Status:** In Progress
**Owner:** Development Team`;
      }
      
      if (path.includes('config.json')) {
        return JSON.stringify({
          workstream: 'ora',
          domain: 'autonomous-agents',
          capabilities: ['llm-integration', 'data-filtering'],
          endpoints: {
            chat: '/api/contextual-chat',
            artefacts: '/api/demo-loops'
          }
        });
      }
      
      return 'Mock file content';
    });
  });

  describe('generateWorkstreamChatResponse', () => {
    test('generates contextual response for ora workstream', async () => {
      const mockArtefact = {
        id: 'task-1',
        title: 'Test Task',
        workstream: 'ora',
        phase: '11.2',
        status: 'in_progress',
        tags: ['testing'],
        summary: 'Test task summary'
      };

      const response = await generateWorkstreamChatResponse(
        'ora',
        'What is the status of this task?',
        mockArtefact
      );

      expect(response).toBeDefined();
      expect(response.workstream).toBe('ora');
      expect(response.message).toContain('status');
      expect(response.context).toBeDefined();
    });

    test('generates contextual response for mecca workstream', async () => {
      const mockArtefact = {
        id: 'project-1',
        title: 'Business Development Project',
        workstream: 'mecca',
        phase: '1.1',
        status: 'planning',
        tags: ['business', 'development'],
        summary: 'Business development initiative'
      };

      const response = await generateWorkstreamChatResponse(
        'mecca',
        'What are the key business objectives?',
        mockArtefact
      );

      expect(response).toBeDefined();
      expect(response.workstream).toBe('mecca');
      expect(response.context.domain).toBe('business-development');
    });

    test('generates contextual response for sales workstream', async () => {
      const mockArtefact = {
        id: 'sales-1',
        title: 'Customer Acquisition Strategy',
        workstream: 'sales',
        phase: '2.1',
        status: 'active',
        tags: ['sales', 'acquisition'],
        summary: 'Customer acquisition strategy'
      };

      const response = await generateWorkstreamChatResponse(
        'sales',
        'What is our customer acquisition strategy?',
        mockArtefact
      );

      expect(response).toBeDefined();
      expect(response.workstream).toBe('sales');
      expect(response.context.domain).toBe('customer-acquisition');
    });

    test('handles empty message gracefully', async () => {
      const mockArtefact = {
        id: 'task-1',
        title: 'Test Task',
        workstream: 'ora'
      };

      await expect(
        generateWorkstreamChatResponse('ora', '', mockArtefact)
      ).rejects.toThrow('Message cannot be empty');
    });

    test('handles invalid workstream', async () => {
      const mockArtefact = {
        id: 'task-1',
        title: 'Test Task',
        workstream: 'invalid'
      };

      await expect(
        generateWorkstreamChatResponse('invalid', 'Test message', mockArtefact)
      ).rejects.toThrow('Unsupported workstream');
    });

    test('includes artefact context in response', async () => {
      const mockArtefact = {
        id: 'task-1',
        title: 'Critical Security Task',
        workstream: 'ora',
        phase: '11.2',
        status: 'blocked',
        tags: ['security', 'urgent'],
        summary: 'Security vulnerability fix',
        priority: 'high'
      };

      const response = await generateWorkstreamChatResponse(
        'ora',
        'What is blocking this task?',
        mockArtefact
      );

      expect(response.context.artefact).toEqual(mockArtefact);
      expect(response.context.relevantTags).toContain('security');
      expect(response.context.priority).toBe('high');
    });

    test('handles missing artefact data', async () => {
      const response = await generateWorkstreamChatResponse(
        'ora',
        'General question about the workstream',
        null
      );

      expect(response).toBeDefined();
      expect(response.workstream).toBe('ora');
      expect(response.context.artefact).toBeNull();
    });

    test('generates domain-specific responses', async () => {
      const oraArtefact = { workstream: 'ora', title: 'AI Task' };
      const meccaArtefact = { workstream: 'mecca', title: 'Business Task' };

      const oraResponse = await generateWorkstreamChatResponse(
        'ora',
        'How does AI integration work?',
        oraArtefact
      );

      const meccaResponse = await generateWorkstreamChatResponse(
        'mecca',
        'What are our revenue targets?',
        meccaArtefact
      );

      expect(oraResponse.context.capabilities).toContain('autonomous-agents');
      expect(meccaResponse.context.capabilities).toContain('business-development');
    });
  });

  describe('buildWorkstreamLLMContext', () => {
    test('builds comprehensive context for ora workstream', () => {
      const artefact = {
        id: 'task-1',
        title: 'LLM Integration Task',
        workstream: 'ora',
        phase: '11.3',
        status: 'in_progress'
      };

      const context = buildWorkstreamLLMContext('ora', artefact);

      expect(context.workstream).toBe('ora');
      expect(context.domain).toBe('autonomous-agents');
      expect(context.systemPrompt).toContain('autonomous');
      expect(context.capabilities).toContain('llm-integration');
      expect(context.artefactContext).toEqual(artefact);
    });

    test('builds context for mecca workstream', () => {
      const artefact = {
        id: 'project-1',
        title: 'Market Analysis',
        workstream: 'mecca',
        phase: '1.2'
      };

      const context = buildWorkstreamLLMContext('mecca', artefact);

      expect(context.workstream).toBe('mecca');
      expect(context.domain).toBe('business-development');
      expect(context.systemPrompt).toContain('business');
      expect(context.capabilities).toContain('market-analysis');
    });

    test('builds context for sales workstream', () => {
      const artefact = {
        id: 'sales-1',
        title: 'Lead Generation',
        workstream: 'sales'
      };

      const context = buildWorkstreamLLMContext('sales', artefact);

      expect(context.workstream).toBe('sales');
      expect(context.domain).toBe('customer-acquisition');
      expect(context.systemPrompt).toContain('sales');
      expect(context.capabilities).toContain('lead-generation');
    });

    test('includes phase-specific context', () => {
      const phase11Artefact = { workstream: 'ora', phase: '11.2' };
      const phase12Artefact = { workstream: 'ora', phase: '12.1' };

      const context11 = buildWorkstreamLLLContext('ora', phase11Artefact);
      const context12 = buildWorkstreamLLMContext('ora', phase12Artefact);

      expect(context11.phaseContext).toContain('Phase 11');
      expect(context12.phaseContext).toContain('Phase 12');
      expect(context11.phaseContext).not.toEqual(context12.phaseContext);
    });

    test('handles null artefact', () => {
      const context = buildWorkstreamLLMContext('ora', null);

      expect(context.workstream).toBe('ora');
      expect(context.artefactContext).toBeNull();
      expect(context.systemPrompt).toBeDefined();
    });

    test('includes roadmap context when available', async () => {
      const artefact = { workstream: 'ora', phase: '11' };
      
      const context = buildWorkstreamLLMContext('ora', artefact);

      expect(context.roadmapContext).toBeDefined();
      expect(context.roadmapContext).toContain('Phase 11');
    });

    test('handles workstream isolation', () => {
      const oraArtefact = { workstream: 'ora', tags: ['ai'] };
      const meccaArtefact = { workstream: 'mecca', tags: ['business'] };

      const oraContext = buildWorkstreamLLMContext('ora', oraArtefact);
      const meccaContext = buildWorkstreamLLMContext('mecca', meccaArtefact);

      expect(oraContext.systemPrompt).not.toContain('business');
      expect(meccaContext.systemPrompt).not.toContain('autonomous');
    });
  });

  describe('validateWorkstreamAccess', () => {
    test('validates access for supported workstreams', () => {
      expect(validateWorkstreamAccess('ora')).toBe(true);
      expect(validateWorkstreamAccess('mecca')).toBe(true);
      expect(validateWorkstreamAccess('sales')).toBe(true);
    });

    test('rejects access for unsupported workstreams', () => {
      expect(validateWorkstreamAccess('invalid')).toBe(false);
      expect(validateWorkstreamAccess('')).toBe(false);
      expect(validateWorkstreamAccess(null)).toBe(false);
      expect(validateWorkstreamAccess(undefined)).toBe(false);
    });

    test('is case sensitive', () => {
      expect(validateWorkstreamAccess('ORA')).toBe(false);
      expect(validateWorkstreamAccess('Ora')).toBe(false);
      expect(validateWorkstreamAccess('MECCA')).toBe(false);
    });

    test('handles special characters', () => {
      expect(validateWorkstreamAccess('ora-test')).toBe(false);
      expect(validateWorkstreamAccess('ora_test')).toBe(false);
      expect(validateWorkstreamAccess('ora test')).toBe(false);
    });

    test('validates with user context', () => {
      const userContext = {
        allowedWorkstreams: ['ora', 'mecca'],
        role: 'developer'
      };

      expect(validateWorkstreamAccess('ora', userContext)).toBe(true);
      expect(validateWorkstreamAccess('sales', userContext)).toBe(false);
    });
  });

  describe('getWorkstreamConfig', () => {
    test('returns configuration for ora workstream', async () => {
      const config = await getWorkstreamConfig('ora');

      expect(config.name).toBe('ora');
      expect(config.domain).toBe('autonomous-agents');
      expect(config.capabilities).toContain('llm-integration');
      expect(config.endpoints).toBeDefined();
    });

    test('returns configuration for mecca workstream', async () => {
      const config = await getWorkstreamConfig('mecca');

      expect(config.name).toBe('mecca');
      expect(config.domain).toBe('business-development');
      expect(config.capabilities).toContain('market-analysis');
    });

    test('throws error for invalid workstream', async () => {
      await expect(getWorkstreamConfig('invalid')).rejects.toThrow(
        'Configuration not found for workstream: invalid'
      );
    });

    test('caches configuration for performance', async () => {
      const config1 = await getWorkstreamConfig('ora');
      const config2 = await getWorkstreamConfig('ora');

      expect(config1).toBe(config2); // Should be same reference (cached)
      expect(global.mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    test('handles file read errors', async () => {
      global.mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(getWorkstreamConfig('ora')).rejects.toThrow('File not found');
    });

    test('validates configuration schema', async () => {
      global.mockFs.readFile.mockResolvedValue(JSON.stringify({
        // Missing required fields
        name: 'incomplete'
      }));

      await expect(getWorkstreamConfig('incomplete')).rejects.toThrow(
        'Invalid configuration schema'
      );
    });
  });

  describe('formatWorkstreamPath', () => {
    test('formats paths for ora workstream', () => {
      expect(formatWorkstreamPath('ora', 'artefacts/task.md')).toBe(
        'runtime/workstreams/ora/artefacts/task.md'
      );
    });

    test('formats paths for different workstreams', () => {
      expect(formatWorkstreamPath('mecca', 'projects/project.md')).toBe(
        'runtime/workstreams/mecca/projects/project.md'
      );
      
      expect(formatWorkstreamPath('sales', 'leads/lead.json')).toBe(
        'runtime/workstreams/sales/leads/lead.json'
      );
    });

    test('handles absolute paths', () => {
      expect(formatWorkstreamPath('ora', '/absolute/path.md')).toBe(
        'runtime/workstreams/ora/absolute/path.md'
      );
    });

    test('handles empty file paths', () => {
      expect(formatWorkstreamPath('ora', '')).toBe(
        'runtime/workstreams/ora/'
      );
    });

    test('normalizes path separators', () => {
      expect(formatWorkstreamPath('ora', 'folder\\file.md')).toBe(
        'runtime/workstreams/ora/folder/file.md'
      );
    });

    test('validates workstream name', () => {
      expect(() => formatWorkstreamPath('', 'file.md')).toThrow(
        'Workstream name cannot be empty'
      );
      
      expect(() => formatWorkstreamPath(null, 'file.md')).toThrow(
        'Workstream name cannot be empty'
      );
    });

    test('handles special characters in paths', () => {
      expect(formatWorkstreamPath('ora', 'folder with spaces/file-name.md')).toBe(
        'runtime/workstreams/ora/folder with spaces/file-name.md'
      );
    });
  });

  describe('Integration Tests', () => {
    test('full workflow: build context and generate response', async () => {
      const artefact = {
        id: 'integration-test',
        title: 'Integration Test Task',
        workstream: 'ora',
        phase: '11.2',
        status: 'in_progress',
        tags: ['integration', 'testing']
      };

      const context = buildWorkstreamLLMContext('ora', artefact);
      const response = await generateWorkstreamChatResponse(
        'ora',
        'What should I focus on for this integration test?',
        artefact
      );

      expect(context.workstream).toBe(response.workstream);
      expect(response.context.artefact).toEqual(artefact);
    });

    test('workstream isolation in full workflow', async () => {
      const oraArtefact = { workstream: 'ora', title: 'AI Task' };
      const meccaArtefact = { workstream: 'mecca', title: 'Business Task' };

      const oraResponse = await generateWorkstreamChatResponse(
        'ora', 'AI question', oraArtefact
      );
      const meccaResponse = await generateWorkstreamChatResponse(
        'mecca', 'Business question', meccaArtefact
      );

      expect(oraResponse.context.domain).not.toBe(meccaResponse.context.domain);
      expect(oraResponse.context.capabilities).not.toEqual(meccaResponse.context.capabilities);
    });

    test('error propagation through workflow', async () => {
      global.mockFs.readFile.mockRejectedValue(new Error('System error'));

      const artefact = { workstream: 'ora', title: 'Test' };

      await expect(
        generateWorkstreamChatResponse('ora', 'Test message', artefact)
      ).rejects.toThrow('System error');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('handles concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        generateWorkstreamChatResponse(
          'ora',
          `Concurrent message ${i}`,
          { workstream: 'ora', id: `task-${i}` }
        )
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(10);
      responses.forEach((response, i) => {
        expect(response.workstream).toBe('ora');
        expect(response.message).toContain(`${i}`);
      });
    });

    test('handles large artefact objects', async () => {
      const largeArtefact = {
        workstream: 'ora',
        title: 'Large Task',
        summary: 'Very long summary '.repeat(1000),
        tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`),
        metadata: { large: 'data'.repeat(10000) }
      };

      const startTime = performance.now();
      const response = await generateWorkstreamChatResponse(
        'ora',
        'Process this large artefact',
        largeArtefact
      );
      const endTime = performance.now();

      expect(response).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('handles memory pressure gracefully', () => {
      // Simulate memory pressure by creating many contexts
      const contexts = Array.from({ length: 1000 }, (_, i) =>
        buildWorkstreamLLMContext('ora', { workstream: 'ora', id: `task-${i}` })
      );

      expect(contexts).toHaveLength(1000);
      contexts.forEach(context => {
        expect(context.workstream).toBe('ora');
      });
    });
  });
}); 