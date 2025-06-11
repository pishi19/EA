import { NextRequest, NextResponse } from 'next/server';
import { 
  withWorkstreamContext, 
  WorkstreamContext,
  createWorkstreamResponse,
  createWorkstreamErrorResponse,
  logWorkstreamOperation,
  hasWorkstreamPermission
} from '@/lib/workstream-api';
import { 
  generateWorkstreamChatResponse,
  validateWorkstreamMutation,
  logWorkstreamAgenticAction,
  PhaseContext,
  ArtefactContext
} from '@/lib/workstream-llm-enhanced';



interface ChatRequest {
    artefactId: string;
    message: string;
    workstream?: string;
    context?: {
        artefact: {
            id: string;
            title: string;
            status: string;
            tags: string[];
            summary: string;
            phase: string;
            workstream: string;
        };
    };
}

interface ChatResponse {
    message: string;
    mutation?: {
        type: 'status_change' | 'add_tag' | 'update_summary';
        action: string;
        newValue: string;
    };
    error?: string;
}

async function handleArtefactChatRequest(
    request: NextRequest,
    workstreamContext: WorkstreamContext
): Promise<NextResponse> {
    const { workstream } = workstreamContext;

    // Check permissions
    if (!hasWorkstreamPermission(workstream, 'chat')) {
        await logWorkstreamOperation({
            workstream,
            operation: 'chat',
            endpoint: '/api/artefact-chat',
            result: 'error',
            error: 'Insufficient permissions'
        });
        
        return createWorkstreamErrorResponse(
            'Insufficient permissions for chat operations',
            workstreamContext,
            403
        );
    }

    try {
        const body: ChatRequest = await request.json();
        const { artefactId, message, context } = body;

        if (!artefactId || !message) {
            return createWorkstreamErrorResponse(
                'Missing required fields: artefactId and message',
                workstreamContext,
                400
            );
        }

        const artefact = context?.artefact;
        if (!artefact) {
            return createWorkstreamErrorResponse(
                'Artefact context is required',
                workstreamContext,
                400
            );
        }

        // Ensure workstream isolation - validate artefact belongs to current workstream
        if (artefact.workstream && artefact.workstream.toLowerCase() !== workstream.toLowerCase()) {
            await logWorkstreamOperation({
                workstream,
                operation: 'chat',
                endpoint: '/api/artefact-chat',
                data: { artefactId, artefactWorkstream: artefact.workstream },
                result: 'error',
                error: 'Cross-workstream access denied'
            });
            
            return createWorkstreamErrorResponse(
                'Cannot access artefact from different workstream',
                workstreamContext,
                403
            );
        }

        // Set workstream context for artefact if not already set
        if (!artefact.workstream) {
            artefact.workstream = workstream;
        }

        // Fetch phase context for enhanced LLM reasoning
        const phaseContext = await getPhaseContext(artefact.phase, workstream);

        // Generate workstream-aware LLM response with enhanced context injection
        const artefactContext: ArtefactContext = {
            id: artefact.id,
            title: artefact.title,
            status: artefact.status,
            phase: artefact.phase,
            workstream: artefact.workstream,
            tags: artefact.tags,
            summary: artefact.summary,
            created: (artefact as any).created || new Date().toISOString()
        };

        const llmResponse = await generateWorkstreamChatResponse(
            message,
            workstreamContext,
            phaseContext,
            artefactContext
        );

        // Validate mutation if present
        let validatedMutation: ChatResponse['mutation'] | undefined;
        if (llmResponse.mutation) {
            const validation = validateWorkstreamMutation(
                llmResponse.mutation,
                workstreamContext,
                artefactContext
            );

            if (validation.isValid) {
                validatedMutation = llmResponse.mutation;
            } else {
                // Log validation failure
                await logWorkstreamAgenticAction(workstreamContext, {
                    type: 'mutation',
                    description: `Mutation validation failed: ${validation.errors.join(', ')}`,
                    artefactId: artefact.id,
                    mutation: llmResponse.mutation,
                    outcome: 'error'
                });
            }
        }

        const response: ChatResponse = {
            message: llmResponse.message,
            mutation: validatedMutation
        };

        // Log agentic action
        await logWorkstreamAgenticAction(workstreamContext, {
            type: 'chat',
            description: `Artefact chat interaction: ${message.substring(0, 50)}...`,
            artefactId: artefact.id,
            mutation: validatedMutation,
            outcome: 'success',
            reasoning: llmResponse.reasoning
        });

        await logWorkstreamOperation({
            workstream,
            operation: 'chat',
            endpoint: '/api/artefact-chat',
            data: { artefactId, messageLength: message.length, hasMutation: !!response.mutation },
            result: 'success'
        });

        return createWorkstreamResponse(response, workstreamContext);

    } catch (error) {
        console.error(`Artefact chat error for workstream ${workstream}:`, error);
        
        await logWorkstreamOperation({
            workstream,
            operation: 'chat',
            endpoint: '/api/artefact-chat',
            result: 'error',
            error: String(error)
        });

        return createWorkstreamErrorResponse(
            'Internal server error',
            workstreamContext,
            500
        );
    }
}

export const POST = withWorkstreamContext(handleArtefactChatRequest);

async function getPhaseContext(phase: string, workstream?: string): Promise<PhaseContext | null> {
    try {
        // Extract phase number from phase string (e.g., "Phase 11" -> "11")
        const phaseNumber = phase.match(/\d+/)?.[0];
        if (!phaseNumber) return null;

        const url = `http://localhost:3000/api/phase-context?phase=${phaseNumber}${workstream ? `&workstream=${workstream}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching phase context for workstream ${workstream}:`, error);
        return null;
    }
}

 