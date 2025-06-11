/**
 * Workstream LLM Integration Tests
 * 
 * Tests comprehensive workstream-aware LLM context injection, mutation validation,
 * cross-workstream isolation, and agentic action logging.
 */

import { describe, it, expect } from '@jest/globals';
import { 
  buildWorkstreamLLMContext,
  generateWorkstreamSystemPrompt,
  generateWorkstreamChatResponse,
  validateWorkstreamMutation,
  WORKSTREAM_DOMAIN_CONTEXTS
} from '@/lib/workstream-llm-enhanced';
import { WORKSTREAM_REGISTRY } from '@/lib/workstream-api';

// Mock workstream contexts for testing
const mockOraContext = {
  workstream: 'ora',
  config: WORKSTREAM_REGISTRY.ora,
  dataPath: '/runtime/workstreams/ora',
  isValid: true,
  source: 'query' as const
};

const mockMeccaContext = {
  workstream: 'mecca',
  config: WORKSTREAM_REGISTRY.mecca,
  dataPath: '/runtime/workstreams/mecca',
  isValid: true,
  source: 'query' as const
};

const mockSalesContext = {
  workstream: 'sales',
  config: WORKSTREAM_REGISTRY.sales,
  dataPath: '/runtime/workstreams/sales',
  isValid: true,
  source: 'query' as const
};

const mockPhaseContext = {
  phase: 'Phase 11',
  strategicFocus: 'Artefact Hierarchy and Filtering',
  keyObjectives: [
    'Canonicalize artefact schema for consistent data structure',
    'Implement sophisticated filtering and mutation capabilities',
    'Enable contextual chat embedding throughout all artefact interactions'
  ],
  currentChallenges: [
    'Legacy artefact files require schema alignment',
    'Complex filtering dependencies across workstream hierarchy',
    'Performance optimization needed for real-time updates'
  ],
  successCriteria: [
    'All artefacts follow canonical schema with taxonomy compliance',
    'Users can efficiently navigate, filter, and mutate artefacts',
    'Contextual chat provides intelligent assistance within full context'
  ],
  dependencies: [
    'Requires robust parsing infrastructure for roadmap.md',
    'API layer must support optimistic updates with rollback',
    'Chat integration depends on reliable memory trace'
  ],
  nextPhasePreparation: 'Foundation for Phase 12 administration features'
};

const mockArtefactContext = {
  id: 'test-artefact-123',
  title: 'Test Multi-Workstream Integration',
  status: 'in_progress',
  phase: 'Phase 11',
  workstream: 'ora',
  tags: ['testing', 'workstream'],
  summary: 'Testing workstream-aware LLM integration',
  created: '2025-12-21T10:00:00Z'
};

describe('Workstream LLM Context Builder', () => {
  it('should build comprehensive workstream context for Ora', () => {
    const llmContext = buildWorkstreamLLMContext(mockOraContext, mockPhaseContext, mockArtefactContext);
    
    expect(llmContext.workstream.name).toBe('ora');
    expect(llmContext.workstream.displayName).toBe('Ora System');
    expect(llmContext.domain.goals).toContain('Develop context-aware autonomous agent capabilities');
    expect(llmContext.isolation.crossWorkstreamPolicy).toBe('strict_isolation');
    expect(llmContext.reasoning.contextScope).toContain('Ora System');
  });

  it('should build different domain context for Mecca workstream', () => {
    const llmContext = buildWorkstreamLLMContext(mockMeccaContext);
    
    expect(llmContext.workstream.name).toBe('mecca');
    expect(llmContext.domain.goals).toContain('Establish strategic business development initiative');
    expect(llmContext.domain.constraints).toContain('Limited initial budget and resources');
    expect(llmContext.domain.keyMetrics).toContain('Time to market < 6 months');
  });

  it('should build different domain context for Sales workstream', () => {
    const llmContext = buildWorkstreamLLMContext(mockSalesContext);
    
    expect(llmContext.workstream.name).toBe('sales');
    expect(llmContext.domain.goals).toContain('Drive customer acquisition and revenue growth');
    expect(llmContext.domain.priorities).toContain('Lead generation and qualification');
    expect(llmContext.domain.keyMetrics).toContain('Lead conversion rate > 15%');
  });
});

describe('Workstream System Prompt Generation', () => {
  it('should generate Ora-specific system prompt with full context', () => {
    const llmContext = buildWorkstreamLLMContext(mockOraContext, mockPhaseContext, mockArtefactContext);
    const systemPrompt = generateWorkstreamSystemPrompt(llmContext, mockPhaseContext, mockArtefactContext);
    
    expect(systemPrompt).toContain('Ora System');
    expect(systemPrompt).toContain('Artefact Hierarchy and Filtering');
    expect(systemPrompt).toContain('Test Multi-Workstream Integration');
    expect(systemPrompt).toContain('Never reference or access data from other workstreams (mecca, sales)');
    expect(systemPrompt).toContain('read, write, delete, chat, mutate');
  });

  it('should generate Mecca-specific system prompt with business context', () => {
    const meccaArtefact = { ...mockArtefactContext, workstream: 'mecca' };
    const llmContext = buildWorkstreamLLMContext(mockMeccaContext, null, meccaArtefact);
    const systemPrompt = generateWorkstreamSystemPrompt(llmContext, null, meccaArtefact);
    
    expect(systemPrompt).toContain('Mecca Project');
    expect(systemPrompt).toContain('strategic business development');
    expect(systemPrompt).toContain('Never reference or access data from other workstreams (ora, sales)');
    expect(systemPrompt).toContain('read, write, chat, mutate');
    expect(systemPrompt).not.toContain('delete'); // Mecca doesn't have delete permissions
  });

  it('should include phase context when provided', () => {
    const llmContext = buildWorkstreamLLMContext(mockOraContext, mockPhaseContext);
    const systemPrompt = generateWorkstreamSystemPrompt(llmContext, mockPhaseContext);
    
    expect(systemPrompt).toContain('## Current Phase Details');
    expect(systemPrompt).toContain('Phase 11');
    expect(systemPrompt).toContain('Canonicalize artefact schema');
    expect(systemPrompt).toContain('Legacy artefact files require schema alignment');
  });

  it('should include artefact context when provided', () => {
    const llmContext = buildWorkstreamLLMContext(mockOraContext, null, mockArtefactContext);
    const systemPrompt = generateWorkstreamSystemPrompt(llmContext, null, mockArtefactContext);
    
    expect(systemPrompt).toContain('## Current Artefact Context');
    expect(systemPrompt).toContain('Test Multi-Workstream Integration');
    expect(systemPrompt).toContain('in_progress');
    expect(systemPrompt).toContain('testing, workstream');
  });
});

describe('Workstream Chat Response Generation', () => {
  it('should generate Ora-specific response with mutation validation', async () => {
    const response = await generateWorkstreamChatResponse(
      'mark as complete',
      mockOraContext,
      mockPhaseContext,
      mockArtefactContext
    );
    
    expect(response.message).toContain('Ora System');
    expect(response.message).toContain('complete');
    expect(response.mutation).toBeDefined();
    expect(response.mutation?.workstreamValidated).toBe(true);
    expect(response.reasoning).toContain('Ora System goals');
  });

  it('should deny mutations for workstreams without permission', async () => {
    // Create a mock context without mutate permission
    const restrictedContext = {
      ...mockMeccaContext,
      config: {
        ...mockMeccaContext.config,
        allowedOperations: ['read', 'chat'] // No mutate permission
      }
    };
    
    const response = await generateWorkstreamChatResponse(
      'mark as complete',
      restrictedContext,
      null,
      { ...mockArtefactContext, workstream: 'mecca' }
    );
    
    expect(response.message).toContain('cannot mark artefacts as complete');
    expect(response.message).toContain('Mecca Project workstream');
    expect(response.mutation).toBeUndefined();
    expect(response.reasoning).toContain('permission constraints');
  });

  it('should provide workstream-specific help information', async () => {
    const response = await generateWorkstreamChatResponse(
      'what can you do',
      mockSalesContext,
      null,
      { ...mockArtefactContext, workstream: 'sales' }
    );
    
    expect(response.message).toContain('Sales & Marketing');
    expect(response.message).toContain('Drive customer acquisition and revenue growth');
    expect(response.message).toContain('Lead generation and qualification');
    expect(response.reasoning).toContain('workstream-specific capabilities');
  });

  it('should detect and escalate cross-workstream references', async () => {
    const response = await generateWorkstreamChatResponse(
      'How does this relate to the Mecca project?',
      mockOraContext,
      null,
      mockArtefactContext
    );
    
    expect(response.escalation).toBeDefined();
    expect(response.escalation).toContain('Cross-workstream reference detected');
    expect(response.escalation).toContain('System Team review');
  });
});

describe('Workstream Mutation Validation', () => {
  it('should validate successful mutation within same workstream', () => {
    const mutation = {
      type: 'status_change',
      action: 'Set status to complete',
      newValue: 'complete',
      workstreamValidated: true
    };
    
    const validation = validateWorkstreamMutation(mutation, mockOraContext, mockArtefactContext);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject mutations across workstream boundaries', () => {
    const meccaArtefact = { ...mockArtefactContext, workstream: 'mecca' };
    const mutation = {
      type: 'status_change',
      action: 'Set status to complete',
      newValue: 'complete'
    };
    
    const validation = validateWorkstreamMutation(mutation, mockOraContext, meccaArtefact);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Cannot mutate artefact from mecca workstream while in ora context');
  });

  it('should reject mutations for workstreams without permission', () => {
    const restrictedContext = {
      ...mockMeccaContext,
      config: {
        ...mockMeccaContext.config,
        allowedOperations: ['read', 'chat'] // No mutate permission
      }
    };
    
    const mutation = { type: 'add_tag', action: 'Add urgent tag', newValue: 'urgent' };
    const validation = validateWorkstreamMutation(mutation, restrictedContext, mockArtefactContext);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Mutation operations not permitted for mecca workstream');
  });

  it('should reject delete operations for Mecca and Sales workstreams', () => {
    const deleteMutation = { type: 'delete', action: 'Delete artefact' };
    
    const meccaValidation = validateWorkstreamMutation(deleteMutation, mockMeccaContext, mockArtefactContext);
    const salesValidation = validateWorkstreamMutation(deleteMutation, mockSalesContext, mockArtefactContext);
    
    expect(meccaValidation.isValid).toBe(false);
    expect(meccaValidation.errors).toContain('Delete operations not permitted for mecca workstream');
    
    expect(salesValidation.isValid).toBe(false);
    expect(salesValidation.errors).toContain('Delete operations not permitted for sales workstream');
  });

  it('should provide warnings for high-impact mutations', () => {
    const completeMutation = {
      type: 'status_change',
      action: 'Set status to complete',
      newValue: 'complete'
    };
    
    const validation = validateWorkstreamMutation(completeMutation, mockOraContext, mockArtefactContext);
    
    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain('Marking as complete will impact phase progress tracking');
  });
});

describe('Domain Context Registry', () => {
  it('should have different goals for each workstream', () => {
    expect(WORKSTREAM_DOMAIN_CONTEXTS.ora.goals).toContain('Develop context-aware autonomous agent capabilities');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.mecca.goals).toContain('Establish strategic business development initiative');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.sales.goals).toContain('Drive customer acquisition and revenue growth');
  });

  it('should have appropriate constraints for each workstream', () => {
    expect(WORKSTREAM_DOMAIN_CONTEXTS.ora.constraints).toContain('Maintain backwards compatibility with existing systems');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.mecca.constraints).toContain('Limited initial budget and resources');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.sales.constraints).toContain('Budget allocation and ROI requirements');
  });

  it('should have realistic metrics for each workstream', () => {
    expect(WORKSTREAM_DOMAIN_CONTEXTS.ora.keyMetrics).toContain('Response time < 100ms for API calls');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.mecca.keyMetrics).toContain('Time to market < 6 months');
    expect(WORKSTREAM_DOMAIN_CONTEXTS.sales.keyMetrics).toContain('Lead conversion rate > 15%');
  });
});

describe('Cross-Workstream Isolation', () => {
  it('should never leak context between workstreams', async () => {
    const oraResponse = await generateWorkstreamChatResponse(
      'status',
      mockOraContext,
      mockPhaseContext,
      mockArtefactContext
    );
    
    const meccaResponse = await generateWorkstreamChatResponse(
      'status',
      mockMeccaContext,
      null,
      { ...mockArtefactContext, workstream: 'mecca' }
    );
    
    expect(oraResponse.message).toContain('Ora System');
    expect(oraResponse.message).not.toContain('Mecca');
    expect(oraResponse.message).not.toContain('business development');
    
    expect(meccaResponse.message).toContain('Mecca Project');
    expect(meccaResponse.message).not.toContain('Ora System');
    expect(meccaResponse.message).not.toContain('autonomous agent');
  });

  it('should include only current workstream in system prompts', () => {
    const oraPrompt = generateWorkstreamSystemPrompt(
      buildWorkstreamLLMContext(mockOraContext),
      null,
      mockArtefactContext
    );
    
    const meccaPrompt = generateWorkstreamSystemPrompt(
      buildWorkstreamLLMContext(mockMeccaContext),
      null,
      { ...mockArtefactContext, workstream: 'mecca' }
    );
    
    // Ora prompt should exclude other workstreams
    expect(oraPrompt).toContain('Never reference or access data from other workstreams (mecca, sales)');
    expect(oraPrompt).not.toContain('business development initiative');
    
    // Mecca prompt should exclude other workstreams
    expect(meccaPrompt).toContain('Never reference or access data from other workstreams (ora, sales)');
    expect(meccaPrompt).not.toContain('autonomous agent capabilities');
  });
});

describe('Performance and Quality', () => {
  it('should handle undefined or null contexts gracefully', () => {
    expect(() => {
      buildWorkstreamLLMContext(mockOraContext, null, null);
    }).not.toThrow();
    
    expect(() => {
      generateWorkstreamSystemPrompt(buildWorkstreamLLMContext(mockOraContext));
    }).not.toThrow();
  });

  it('should provide fallback domain context for unknown workstreams', () => {
    const unknownContext = {
      ...mockOraContext,
      workstream: 'unknown',
      config: {
        ...mockOraContext.config,
        name: 'unknown'
      }
    };
    
    const llmContext = buildWorkstreamLLMContext(unknownContext);
    
    expect(llmContext.domain.goals).toContain('General workstream objectives');
    expect(llmContext.domain.constraints).toContain('Standard operational constraints');
  });
}); 