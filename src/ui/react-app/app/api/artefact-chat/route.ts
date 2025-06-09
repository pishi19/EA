import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
    artefactId: string;
    message: string;
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

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { artefactId, message, context } = body;

        if (!artefactId || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: artefactId and message' },
                { status: 400 }
            );
        }

        const artefact = context?.artefact;
        if (!artefact) {
            return NextResponse.json(
                { error: 'Artefact context is required' },
                { status: 400 }
            );
        }

        // Simulate LLM processing with mutation detection
        const response = await processArtefactChat(message, artefact);

        return NextResponse.json(response);

    } catch (error) {
        console.error('Artefact chat error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function processArtefactChat(message: string, artefact: any): Promise<ChatResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Detect mutation intents
    let mutation: ChatResponse['mutation'] | undefined;
    let responseMessage = '';

    if (lowerMessage.includes('mark as complete') || lowerMessage.includes('set to complete')) {
        mutation = {
            type: 'status_change',
            action: 'Set status to complete',
            newValue: 'complete'
        };
        responseMessage = `I'll mark "${artefact.title}" as complete for you.`;
    } else if (lowerMessage.includes('mark as progress') || lowerMessage.includes('in progress')) {
        mutation = {
            type: 'status_change',
            action: 'Set status to in_progress',
            newValue: 'in_progress'
        };
        responseMessage = `I'll update "${artefact.title}" to in_progress status.`;
    } else if (lowerMessage.includes('add tag urgent') || lowerMessage.includes('urgent tag')) {
        mutation = {
            type: 'add_tag',
            action: 'Add "urgent" tag',
            newValue: 'urgent'
        };
        responseMessage = `I'll add the "urgent" tag to "${artefact.title}".`;
    } else if (lowerMessage.includes('add tag review') || lowerMessage.includes('needs review')) {
        mutation = {
            type: 'add_tag',
            action: 'Add "needs-review" tag',
            newValue: 'needs-review'
        };
        responseMessage = `I'll add the "needs-review" tag to "${artefact.title}".`;
    } else if (lowerMessage.includes('status')) {
        responseMessage = `The current status of "${artefact.title}" is **${artefact.status}**. `;
        if (artefact.status === 'planning') {
            responseMessage += 'Would you like me to move it to "in_progress" status? Just say "mark as in progress" and I\'ll update it for you.';
        } else if (artefact.status === 'in_progress') {
            responseMessage += 'This artefact is actively being worked on. Would you like me to mark it as complete when finished?';
        }
    } else if (lowerMessage.includes('tag')) {
        responseMessage = `I can help you manage tags for "${artefact.title}". Current tags: ${artefact.tags.join(', ') || 'none'}. What tag would you like to add?`;
    } else if (lowerMessage.includes('summary')) {
        responseMessage = `Here's the current summary: "${artefact.summary}". Would you like me to update it?`;
    } else {
        responseMessage = `I understand you're asking about "${artefact.title}". This artefact is part of ${artefact.phase} and has ${artefact.tags.length} tags. I can help you update its status, add tags, or modify its summary. What would you like me to do?`;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return {
        message: responseMessage,
        mutation
    };
} 