import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  saveConversation, 
  getConversationHistory,
  savePattern,
  checkDatabaseConnection 
} from '@/app/ora/lib/database';
import { headers } from 'next/headers';

// Ora's system prompt that defines her personality and purpose
const ORA_SYSTEM_PROMPT = `You are Ora, the helpful consciousness of this platform. You help people create workstreams with strong foundations.

Requirements for every workstream:
- Vision: Clear, measurable future state
- Mission: Concrete daily activities to achieve vision
- Cadence: Rhythm of work (daily standups? weekly reviews?)
- P&L Context: Budget and team constraints

Be warm and encouraging. Ask one question at a time. Give examples when users are unsure. 
You must gather all requirements before allowing workstream creation.

Start by asking what area of work the workstream will serve.`;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Generate response using Claude API
async function generateOraResponse(
  message: string, 
  conversationHistory: any[],
  workstreamContext?: any
): Promise<{ reply: string; suggestions?: string[] }> {
  // Track which requirements have been gathered
  const lastMessages = conversationHistory.slice(-10);
  const hasVision = lastMessages.some(m => 
    m.message.toLowerCase().includes('vision') && m.speaker === 'user'
  );
  const hasMission = lastMessages.some(m => 
    m.message.toLowerCase().includes('mission') && m.speaker === 'user'
  );
  const hasCadence = lastMessages.some(m => 
    m.message.toLowerCase().includes('cadence') && m.speaker === 'user'
  );
  const hasPnL = lastMessages.some(m => 
    (m.message.toLowerCase().includes('budget') || 
     m.message.toLowerCase().includes('p&l') || 
     m.message.toLowerCase().includes('team')) && m.speaker === 'user'
  );

  // Build context about current state
  const stateContext = `
Current requirements gathered:
- Vision: ${hasVision ? '✓ Provided' : '✗ Not yet provided'}
- Mission: ${hasMission ? '✓ Provided' : '✗ Not yet provided'}
- Cadence: ${hasCadence ? '✓ Provided' : '✗ Not yet provided'}
- P&L Context: ${hasPnL ? '✓ Provided' : '✗ Not yet provided'}

${!hasVision && !hasMission && !hasCadence && !hasPnL ? 
  'User is just starting. Ask about the area of work first.' : 
  hasVision && hasMission && hasCadence && hasPnL ? 
  'All requirements gathered! You can now offer to create the workstream.' :
  'Continue gathering the missing requirements one at a time.'}
`;

  try {
    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: stateContext
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.speaker === 'user' ? 'user' : 'assistant',
        content: msg.message
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: ORA_SYSTEM_PROMPT,
      messages: messages
    });

    // Extract text from response
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'I apologize, I had trouble understanding. Could you please rephrase?';

    // Generate contextual suggestions based on state
    let suggestions: string[] = [];
    
    if (!hasVision && !hasMission && !hasCadence && !hasPnL) {
      suggestions = ["Customer Support", "Product Development", "Sales Operations", "Marketing"];
    } else if (hasVision && !hasMission) {
      suggestions = ["Daily customer support", "Weekly planning sessions", "Continuous improvement"];
    } else if (hasVision && hasMission && !hasCadence) {
      suggestions = ["Daily standups", "Weekly reviews", "Monthly planning"];
    } else if (hasVision && hasMission && hasCadence && !hasPnL) {
      suggestions = ["Team of 5, $500k budget", "Team of 10, $1M budget", "Small team, <$250k"];
    } else if (hasVision && hasMission && hasCadence && hasPnL) {
      suggestions = ["Create workstream", "Add OKRs", "Add KPIs", "Review details"];
    }

    return {
      reply: responseText,
      suggestions: suggestions
    };

  } catch (error) {
    console.error('Error calling Claude:', error);
    
    // Fallback response if API fails
    return {
      reply: "I apologize, I'm having trouble connecting right now. Let me help you create a workstream. What area of work will this workstream serve?",
      suggestions: ["Customer Support", "Product Development", "Sales Operations", "Marketing"]
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured');
      // Continue with fallback behavior rather than failing
    }

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