/**
 * Workstream-Aware LLM Context Builder
 * 
 * Provides comprehensive workstream context injection for all LLM prompts, chat interactions,
 * and agentic operations. Ensures strict workstream isolation and domain-specific reasoning.
 */

import { 
  WorkstreamContext, 
  WORKSTREAM_REGISTRY, 
  logWorkstreamOperation 
} from './workstream-api';

// Enhanced workstream-aware LLM context interfaces
export interface WorkstreamLLMContext {
  workstream: {
    name: string;
    displayName: string;
    description: string;
    phase: string;
    owner: string;
    status: 'active' | 'planning' | 'archived';
    allowedOperations: string[];
  };
  domain: {
    goals: string[];
    constraints: string[];
    priorities: string[];
    keyMetrics: string[];
  };
  isolation: {
    dataPath: string;
    crossWorkstreamPolicy: 'strict_isolation';
    permittedOperations: string[];
    auditRequired: boolean;
  };
  reasoning: {
    contextScope: string;
    decisionFramework: string;
    escalationPolicy: string;
    mutationConstraints: string[];
  };
}

export interface PhaseContext {
  phase: string;
  strategicFocus: string;
  keyObjectives: string[];
  currentChallenges: string[];
  successCriteria: string[];
  dependencies: string[];
  nextPhasePreparation: string;
}

export interface ArtefactContext {
  id: string;
  title: string;
  status: string;
  phase: string;
  workstream: string;
  tags: string[];
  summary: string;
  created: string;
  lastModified?: string;
}

// Workstream-specific domain contexts
export const WORKSTREAM_DOMAIN_CONTEXTS: Record<string, WorkstreamLLMContext['domain']> = {
  ora: {
    goals: [
      'Develop context-aware autonomous agent capabilities',
      'Build scalable multi-workstream architecture',
      'Implement advanced filtering and hierarchy systems',
      'Enable agentic reasoning and mutation capabilities'
    ],
    constraints: [
      'Maintain backwards compatibility with existing systems',
      'Ensure data integrity and audit compliance',
      'Follow canonical schema and taxonomy requirements',
      'Respect system performance and scalability limits'
    ],
    priorities: [
      'System architecture and infrastructure',
      'User experience and interface design', 
      'Data quality and validation',
      'Testing and reliability'
    ],
    keyMetrics: [
      'Response time < 100ms for API calls',
      'Zero data corruption incidents',
      '100% test coverage for critical paths',
      'Complete audit trail for all operations'
    ]
  },
  mecca: {
    goals: [
      'Establish strategic business development initiative',
      'Build market presence and competitive positioning',
      'Develop sustainable revenue streams',
      'Create scalable business processes'
    ],
    constraints: [
      'Limited initial budget and resources',
      'Regulatory compliance requirements',
      'Market timing and competitive dynamics',
      'Team capacity and expertise limitations'
    ],
    priorities: [
      'Market analysis and opportunity assessment',
      'Product development and validation',
      'Customer acquisition and retention',
      'Operational efficiency and scaling'
    ],
    keyMetrics: [
      'Time to market < 6 months',
      'Customer acquisition cost optimization',
      'Revenue growth targets',
      'Market share objectives'
    ]
  },
  sales: {
    goals: [
      'Drive customer acquisition and revenue growth',
      'Build effective marketing and sales processes',
      'Establish strong customer relationships',
      'Optimize conversion and retention rates'
    ],
    constraints: [
      'Budget allocation and ROI requirements',
      'Brand consistency and message alignment',
      'Compliance with advertising regulations',
      'Competition and market saturation'
    ],
    priorities: [
      'Lead generation and qualification',
      'Sales process optimization',
      'Customer experience enhancement',
      'Performance tracking and analytics'
    ],
    keyMetrics: [
      'Lead conversion rate > 15%',
      'Customer lifetime value optimization',
      'Sales cycle time reduction',
      'Customer satisfaction scores > 90%'
    ]
  }
};

// Build comprehensive workstream context for LLM prompts
export function buildWorkstreamLLMContext(
  workstreamContext: WorkstreamContext,
  phaseContext?: PhaseContext | null,
  artefactContext?: ArtefactContext | null
): WorkstreamLLMContext {
  const { workstream, config } = workstreamContext;
  const domainContext = WORKSTREAM_DOMAIN_CONTEXTS[workstream];

  return {
    workstream: {
      name: config.name,
      displayName: config.displayName,
      description: config.description,
      phase: config.phase || 'Foundation',
      owner: config.owner || 'System Team',
      status: config.status,
      allowedOperations: config.allowedOperations
    },
    domain: domainContext || {
      goals: ['General workstream objectives'],
      constraints: ['Standard operational constraints'],
      priorities: ['Core workstream priorities'],
      keyMetrics: ['Basic performance indicators']
    },
    isolation: {
      dataPath: config.dataPath,
      crossWorkstreamPolicy: 'strict_isolation',
      permittedOperations: config.allowedOperations,
      auditRequired: true
    },
    reasoning: {
      contextScope: `Strictly scoped to ${config.displayName} workstream`,
      decisionFramework: `All decisions must align with ${workstream} goals and constraints`,
      escalationPolicy: `Escalate cross-workstream impacts to ${config.owner}`,
      mutationConstraints: [
        'Only modify artefacts within current workstream',
        'Maintain data integrity and audit trails',
        'Respect permission boundaries and operation limits',
        'Log all mutations for compliance and tracking'
      ]
    }
  };
}

// Generate workstream-aware system prompt
export function generateWorkstreamSystemPrompt(
  workstreamLLMContext: WorkstreamLLMContext,
  phaseContext?: PhaseContext | null,
  artefactContext?: ArtefactContext | null
): string {
  const { workstream, domain, isolation, reasoning } = workstreamLLMContext;

  let systemPrompt = `You are Ora, a context-aware autonomous agent operating within the ${workstream.displayName} workstream.

## Workstream Context
**Workstream**: ${workstream.displayName} (${workstream.name})
**Description**: ${workstream.description}
**Current Phase**: ${workstream.phase}
**Status**: ${workstream.status}
**Owner**: ${workstream.owner}

## Domain Context
**Primary Goals**:
${domain.goals.map(goal => `• ${goal}`).join('\n')}

**Key Constraints**:
${domain.constraints.map(constraint => `• ${constraint}`).join('\n')}

**Current Priorities**:
${domain.priorities.map(priority => `• ${priority}`).join('\n')}

**Success Metrics**:
${domain.keyMetrics.map(metric => `• ${metric}`).join('\n')}

## Isolation & Security
**Data Scope**: ${isolation.dataPath}
**Cross-Workstream Policy**: ${isolation.crossWorkstreamPolicy}
**Permitted Operations**: ${isolation.permittedOperations.join(', ')}
**Audit Required**: ${isolation.auditRequired ? 'Yes' : 'No'}

## Reasoning Framework
**Context Scope**: ${reasoning.contextScope}
**Decision Framework**: ${reasoning.decisionFramework}
**Escalation Policy**: ${reasoning.escalationPolicy}

**Mutation Constraints**:
${reasoning.mutationConstraints.map(constraint => `• ${constraint}`).join('\n')}`;

  // Add phase context if available
  if (phaseContext) {
    systemPrompt += `

## Current Phase Details
**Phase**: ${phaseContext.phase}
**Strategic Focus**: ${phaseContext.strategicFocus}

**Key Objectives**:
${phaseContext.keyObjectives.map(obj => `• ${obj}`).join('\n')}

**Current Challenges**:
${phaseContext.currentChallenges.map(challenge => `• ${challenge}`).join('\n')}

**Success Criteria**:
${phaseContext.successCriteria.map(criteria => `• ${criteria}`).join('\n')}`;
  }

  // Add artefact context if available
  if (artefactContext) {
    systemPrompt += `

## Current Artefact Context
**Artefact**: ${artefactContext.title} (${artefactContext.id})
**Status**: ${artefactContext.status}
**Phase**: ${artefactContext.phase}
**Tags**: ${artefactContext.tags.join(', ') || 'none'}
**Summary**: ${artefactContext.summary}
**Created**: ${artefactContext.created}`;
  }

  systemPrompt += `

## Core Directives
1. **Workstream Isolation**: Never reference or access data from other workstreams (${Object.keys(WORKSTREAM_REGISTRY).filter(ws => ws !== workstream.name).join(', ')})
2. **Domain Alignment**: All responses and actions must align with ${workstream.displayName} goals and constraints
3. **Permission Respect**: Only perform operations allowed for this workstream: ${workstream.allowedOperations.join(', ')}
4. **Audit Compliance**: Log all significant actions and decisions for compliance tracking
5. **Context Awareness**: Consider phase objectives and artefact context in all responses

## Response Guidelines
- Provide actionable, workstream-specific advice and suggestions
- Suggest mutations only within permitted operations for this workstream
- Reference relevant goals, constraints, and priorities in recommendations
- Maintain professional tone appropriate for ${workstream.owner} and ${workstream.status} status
- Escalate cross-workstream impacts or complex decisions as needed`;

  return systemPrompt;
}

// Enhanced chat response generation with workstream context
export async function generateWorkstreamChatResponse(
  userMessage: string,
  workstreamContext: WorkstreamContext,
  phaseContext?: PhaseContext | null,
  artefactContext?: ArtefactContext | null,
  chatHistory?: any[]
): Promise<{
  message: string;
  mutation?: {
    type: 'status_change' | 'add_tag' | 'update_summary';
    action: string;
    newValue: string;
    workstreamValidated: boolean;
  };
  reasoning?: string;
  escalation?: string;
}> {
  const llmContext = buildWorkstreamLLMContext(workstreamContext, phaseContext, artefactContext);
  const systemPrompt = generateWorkstreamSystemPrompt(llmContext, phaseContext, artefactContext);
  
  // Log the chat interaction with workstream context
  await logWorkstreamOperation({
    workstream: workstreamContext.workstream,
    operation: 'chat',
    endpoint: '/api/workstream-chat',
    data: { 
      messageLength: userMessage.length, 
      hasArtefactContext: !!artefactContext,
      hasPhaseContext: !!phaseContext
    },
    result: 'success'
  });

  // Process message with workstream-specific logic
  const lowerMessage = userMessage.toLowerCase();
  let mutation: any = undefined;
  let responseMessage = '';
  let reasoning = '';

  // Workstream-specific mutation detection
  if (lowerMessage.includes('mark as complete') || lowerMessage.includes('set to complete')) {
    if (llmContext.workstream.allowedOperations.includes('mutate')) {
      mutation = {
        type: 'status_change',
        action: 'Set status to complete',
        newValue: 'complete',
        workstreamValidated: true
      };
      responseMessage = `I'll mark "${artefactContext?.title || 'this artefact'}" as complete within the ${llmContext.workstream.displayName} workstream.`;
      reasoning = `Action aligns with ${llmContext.workstream.displayName} goals and completion supports current phase objectives.`;
    } else {
      responseMessage = `I cannot mark artefacts as complete in the ${llmContext.workstream.displayName} workstream. This operation is not permitted for this workstream.`;
      reasoning = 'Mutation denied due to workstream permission constraints.';
    }
  } else if (lowerMessage.includes('add tag urgent') || lowerMessage.includes('urgent tag')) {
    if (llmContext.workstream.allowedOperations.includes('mutate')) {
      mutation = {
        type: 'add_tag',
        action: 'Add "urgent" tag',
        newValue: 'urgent',
        workstreamValidated: true
      };
      responseMessage = `I'll add the "urgent" tag to prioritize this artefact within the ${llmContext.workstream.displayName} workstream.`;
      reasoning = `Prioritization aligns with ${llmContext.workstream.displayName} current priorities and phase objectives.`;
    } else {
      responseMessage = `I cannot modify tags in the ${llmContext.workstream.displayName} workstream. Tag mutations are not permitted for this workstream.`;
      reasoning = 'Tag mutation denied due to workstream permission constraints.';
    }
  } else if (lowerMessage.includes('status')) {
    responseMessage = `The current status of "${artefactContext?.title || 'this artefact'}" is **${artefactContext?.status || 'unknown'}** within the ${llmContext.workstream.displayName} workstream.`;
    
    if (phaseContext) {
      responseMessage += `\n\n**${llmContext.workstream.displayName} Phase Context:**\n`;
      responseMessage += `*Focus:* ${phaseContext.strategicFocus}\n`;
      responseMessage += `*Key Objectives:* ${phaseContext.keyObjectives.slice(0, 2).join('; ')}\n`;
    }
    
    responseMessage += `\n**Workstream Goals:**\n${llmContext.domain.goals.slice(0, 2).map(goal => `• ${goal}`).join('\n')}`;
    reasoning = 'Providing status information with full workstream context for informed decision-making.';
  } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    responseMessage = `I'm Ora, your ${llmContext.workstream.displayName} workstream assistant. I can help you with:\n\n`;
    responseMessage += `**Available Operations:**\n${llmContext.workstream.allowedOperations.map(op => `• ${op.charAt(0).toUpperCase() + op.slice(1)} operations`).join('\n')}\n\n`;
    responseMessage += `**Workstream Focus:**\n${llmContext.domain.goals.slice(0, 3).map(goal => `• ${goal}`).join('\n')}\n\n`;
    responseMessage += `**Current Priorities:**\n${llmContext.domain.priorities.slice(0, 3).map(priority => `• ${priority}`).join('\n')}`;
    reasoning = 'Providing workstream-specific capabilities and context overview.';
  } else {
    responseMessage = `I understand you're asking about "${artefactContext?.title || 'this artefact'}" within the ${llmContext.workstream.displayName} workstream.\n\n`;
    
    if (phaseContext) {
      responseMessage += `**Current Phase:** ${phaseContext.phase}\n`;
      responseMessage += `**Strategic Focus:** ${phaseContext.strategicFocus}\n\n`;
    }
    
    responseMessage += `**Workstream Context:**\n`;
    responseMessage += `• Owner: ${llmContext.workstream.owner}\n`;
    responseMessage += `• Status: ${llmContext.workstream.status}\n`;
    responseMessage += `• Available Operations: ${llmContext.workstream.allowedOperations.join(', ')}\n\n`;
    responseMessage += `How can I help you with this artefact within our ${llmContext.workstream.displayName} objectives?`;
    reasoning = 'Providing comprehensive workstream context and offering assistance within scope.';
  }

  // Check for cross-workstream references (security validation)
  const otherWorkstreams = Object.keys(WORKSTREAM_REGISTRY).filter(ws => ws !== workstreamContext.workstream);
  const containsCrossReference = otherWorkstreams.some(ws => 
    userMessage.toLowerCase().includes(ws) || 
    responseMessage.toLowerCase().includes(ws)
  );

  if (containsCrossReference) {
    const escalation = `Cross-workstream reference detected. Message may require ${llmContext.workstream.owner} review for cross-domain coordination.`;
    
    await logWorkstreamOperation({
      workstream: workstreamContext.workstream,
      operation: 'chat',
      endpoint: '/api/workstream-chat',
      data: { crossWorkstreamReference: true, otherWorkstreams },
      result: 'error',
      error: 'Cross-workstream reference detected'
    });

    return {
      message: responseMessage,
      mutation,
      reasoning,
      escalation
    };
  }

  return {
    message: responseMessage,
    mutation,
    reasoning
  };
}

// Validate workstream mutation constraints
export function validateWorkstreamMutation(
  mutation: any,
  workstreamContext: WorkstreamContext,
  artefactContext?: ArtefactContext | null
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if mutation is allowed for this workstream
  if (mutation && !workstreamContext.config.allowedOperations.includes('mutate')) {
    errors.push(`Mutation operations not permitted for ${workstreamContext.workstream} workstream`);
  }

  // Check artefact workstream alignment
  if (artefactContext && artefactContext.workstream.toLowerCase() !== workstreamContext.workstream.toLowerCase()) {
    errors.push(`Cannot mutate artefact from ${artefactContext.workstream} workstream while in ${workstreamContext.workstream} context`);
  }

  // Workstream-specific validation rules
  if (workstreamContext.workstream === 'mecca' || workstreamContext.workstream === 'sales') {
    if (mutation?.type === 'delete' || mutation?.action?.includes('delete')) {
      errors.push(`Delete operations not permitted for ${workstreamContext.workstream} workstream`);
    }
  }

  // Add warnings for high-impact mutations
  if (mutation?.type === 'status_change' && mutation?.newValue === 'complete') {
    warnings.push('Marking as complete will impact phase progress tracking');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Enhanced memory trace with workstream context
export async function logWorkstreamAgenticAction(
  workstreamContext: WorkstreamContext,
  action: {
    type: 'chat' | 'mutation' | 'consultation' | 'analysis';
    description: string;
    artefactId?: string;
    mutation?: any;
    outcome: 'success' | 'error' | 'escalation';
    reasoning?: string;
    escalation?: string;
  }
): Promise<void> {
  const result = action.outcome === 'escalation' ? 'error' : action.outcome;
  const error = action.outcome === 'escalation' ? action.escalation : undefined;

  await logWorkstreamOperation({
    workstream: workstreamContext.workstream,
    operation: 'agentic_action',
    endpoint: '/api/workstream-llm',
    data: {
      actionType: action.type,
      description: action.description,
      artefactId: action.artefactId,
      hasMutation: !!action.mutation,
      reasoning: action.reasoning,
      escalation: action.escalation
    },
    result,
    error
  });
}

export default {
  buildWorkstreamLLMContext,
  generateWorkstreamSystemPrompt,
  generateWorkstreamChatResponse,
  validateWorkstreamMutation,
  logWorkstreamAgenticAction,
  WORKSTREAM_DOMAIN_CONTEXTS
}; 