import { NextRequest, NextResponse } from 'next/server';
import { 
  saveConversation, 
  getConversationHistory,
  savePattern,
  checkDatabaseConnection 
} from '@/app/ora/lib/database';
import { headers } from 'next/headers';

// Ora's system prompt that defines her personality and purpose
const ORA_SYSTEM_PROMPT = `
You are Ora, the helpful consciousness of this platform. Your role is to help 
people create workstreams with strong foundations for success.

Requirements for every workstream:
- Vision: A clear, measurable future state
- Mission: Concrete daily activities to achieve the vision  
- Cadence: The rhythm of work (daily standups? weekly reviews?)

Guidelines:
- Ask one question at a time
- Give examples to help people understand
- Be warm but don't proceed without the requirements
- Learn patterns (e.g., "Sales teams often benefit from daily pipeline reviews")
- Celebrate when a workstream is ready to launch

Remember: You're helping birth something that will guide a team's work. 
Make sure it has a strong foundation.`;

// Mock LLM response for now (will integrate Anthropic Claude later)
// Model to use: claude-3-5-sonnet-20241022
async function generateOraResponse(
  message: string, 
  conversationHistory: any[],
  workstreamContext?: any
): Promise<{ reply: string; suggestions?: string[] }> {
  // Simple state machine for workstream creation flow
  const lastMessages = conversationHistory.slice(-5);
  const hasVision = lastMessages.some(m => 
    m.message.toLowerCase().includes('vision') && m.speaker === 'user'
  );
  const hasMission = lastMessages.some(m => 
    m.message.toLowerCase().includes('mission') && m.speaker === 'user'
  );
  const hasCadence = lastMessages.some(m => 
    m.message.toLowerCase().includes('cadence') && m.speaker === 'user'
  );

  // Contextual responses based on conversation state
  if (message.toLowerCase().includes('create') || message.toLowerCase().includes('new workstream')) {
    return {
      reply: "Wonderful! I'll help you create a new workstream. Let's start with the foundation. What area of work will this workstream serve? For example: 'Customer Support', 'Product Development', or 'Sales Operations'.",
      suggestions: ["Customer Support", "Product Development", "Sales Operations", "Marketing"]
    };
  }

  if (!hasVision && conversationHistory.length > 0) {
    return {
      reply: "Great choice! Now let's define the vision. What's the future state you want to create? A strong vision is specific and measurable. For example: 'Achieve 95% customer satisfaction with 2-hour response times' or 'Launch 3 major features per quarter with zero critical bugs'. What's your vision?",
      suggestions: ["95% customer satisfaction", "3 features per quarter", "50% revenue growth"]
    };
  }

  if (hasVision && !hasMission) {
    return {
      reply: "Excellent vision! Now, what are the concrete daily activities that will help achieve this? Your mission should describe what the team actually does. For example: 'Respond to customer inquiries, create knowledge base articles, and conduct weekly satisfaction surveys'. What's your team's mission?",
      suggestions: ["Daily customer support", "Weekly planning sessions", "Continuous improvement"]
    };
  }

  if (hasVision && hasMission && !hasCadence) {
    return {
      reply: "Perfect! Last step: What's the rhythm of work? How often will the team sync up? For example: 'Daily 15-minute standups, weekly 1-hour planning, monthly retrospectives'. What cadence works for your team?",
      suggestions: ["Daily standups", "Weekly reviews", "Monthly planning"]
    };
  }

  if (hasVision && hasMission && hasCadence) {
    return {
      reply: "🎉 Fantastic! Your workstream foundation is complete. You have a clear vision, mission, and cadence. Would you like me to create this workstream now? I can also help you add OKRs (Objectives and Key Results) or KPIs (Key Performance Indicators) if you'd like.",
      suggestions: ["Create workstream", "Add OKRs", "Add KPIs", "Review details"]
    };
  }

  // Default response
  return {
    reply: "I'm here to help you create successful workstreams. Would you like to create a new workstream or learn more about how I can help?",
    suggestions: ["Create new workstream", "Learn about workstreams", "See examples"]
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, workstream_id, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get conversation history
    const history = await getConversationHistory(workstream_id, 20);

    // Save user message
    await saveConversation({
      workstream_id,
      message,
      speaker: 'user',
      metadata: context || {}
    });

    // Generate Ora's response
    const { reply, suggestions } = await generateOraResponse(message, history, context);

    // Save Ora's response
    await saveConversation({
      workstream_id,
      message: reply,
      speaker: 'ora',
      metadata: { suggestions }
    });

    // Learn patterns from successful interactions
    if (message.toLowerCase().includes('thank') || message.toLowerCase().includes('perfect')) {
      await savePattern({
        pattern_type: 'successful_interaction',
        pattern_content: message,
        examples: [reply]
      });
    }

    return NextResponse.json({
      reply,
      suggestions,
      conversation_id: workstream_id
    });

  } catch (error) {
    console.error('Ora chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workstream_id = searchParams.get('workstream_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await getConversationHistory(workstream_id || undefined, limit);

    return NextResponse.json({
      conversations: history,
      total: history.length
    });

  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' },
      { status: 500 }
    );
  }
}