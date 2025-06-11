import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { mutationEngine } from '../../../../../system/mutation-engine';
import { matterOptions } from '@/lib/yaml-engine';
import { logChatInteraction } from '@/lib/interaction-logger';

// --- Types ---
export interface ChatMessage {
    timestamp: string;
    speaker: 'user' | 'ora';
    message: string;
}

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const RUNTIME_DIR = path.join(BASE_DIR, 'runtime');

function getChatFilePath(contextType: string, contextId: string, filePath?: string): string {
    if (filePath) {
        // If filePath is provided, use it directly (relative to BASE_DIR)
        return path.join(BASE_DIR, filePath);
    }
    
    // Fallback to runtime/chat/{contextId}.md
    return path.join(RUNTIME_DIR, 'chat', `${contextId}.md`);
}

function getContextFilePath(contextType: string, contextId: string): string {
    switch (contextType) {
        case 'loop':
            return path.join(RUNTIME_DIR, 'loops', `${contextId}.md`);
        case 'task':
            return path.join(RUNTIME_DIR, 'tasks', `${contextId}.md`);
        case 'phase':
            return path.join(RUNTIME_DIR, 'phases', contextId, 'phase.md');
        default:
            throw new Error(`Invalid context type: ${contextType}`);
    }
}

// --- AI Response Generation ---
async function generateAIResponse(userMessage: string, contextType: string, contextId: string, filePath?: string): Promise<string> {
    try {
        // Load artefact context if available
        let artefactContext = '';
        if (filePath) {
            try {
                const fullPath = path.join(BASE_DIR, filePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                const parsed = matter(content, matterOptions);
                
                artefactContext = `
Artefact Context:
- Title: ${parsed.data.title || contextId}
- Phase: ${parsed.data.phase || 'N/A'}
- Workstream: ${parsed.data.workstream || 'N/A'}
- Status: ${parsed.data.status || 'N/A'}
- Tags: ${parsed.data.tags ? parsed.data.tags.join(', ') : 'N/A'}
- Type: ${parsed.data.type || contextType}

Content Summary:
${content.substring(0, 500)}...
`;
            } catch (error) {
                artefactContext = `Working with ${contextType}: ${contextId}`;
            }
        } else {
            artefactContext = `Working with ${contextType}: ${contextId}`;
        }

        // Generate contextual response based on message content
        const response = await generateContextualResponse(userMessage, artefactContext, contextType, contextId);
        return response;

    } catch (error) {
        console.error('Error generating AI response:', error);
        return `I'm here to help with your ${contextType}. Could you please rephrase your question or let me know what specific assistance you need?`;
    }
}

async function generateContextualResponse(message: string, context: string, contextType: string, contextId: string): Promise<string> {
    const messageLower = message.toLowerCase();

    // Greeting responses
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
        return `Hello! I'm here to help you with this ${contextType}. ${context.includes('Title:') ? `We're working on "${context.match(/Title: ([^\n]*)/)?.[1] || contextId}".` : ''} What would you like to know or discuss?`;
    }

    // Status and progress queries
    if (messageLower.includes('status') || messageLower.includes('progress') || messageLower.includes('where are we')) {
        if (context.includes('Status:')) {
            const status = context.match(/Status: ([^\n]*)/)?.[1] || 'Unknown';
            return `The current status of this ${contextType} is: ${status}. ${getStatusAdvice(status)} What specific aspect would you like to explore further?`;
        }
        return `I can help you understand the current state of this ${contextType}. What specific progress or status information are you looking for?`;
    }

    // General help and guidance
    if (messageLower.includes('help') || messageLower.includes('what') || messageLower.includes('how')) {
        return `I can assist you with this ${contextType} in several ways:

${getContextSpecificHelp(contextType, context)}

Feel free to ask about any specific aspect you'd like to explore!`;
    }

    // Context and background
    if (messageLower.includes('context') || messageLower.includes('background') || messageLower.includes('about')) {
        return `Here's what I know about this ${contextType}:

${context}

Is there a particular aspect you'd like me to explain in more detail?`;
    }

    // Next steps and planning
    if (messageLower.includes('next') || messageLower.includes('plan') || messageLower.includes('should')) {
        return getNextStepsAdvice(contextType, context);
    }

    // Testing queries  
    if (messageLower.includes('test') || messageLower.includes('testing')) {
        return `I'm working perfectly! Thanks for testing the chat functionality. I can help you with:

• Understanding this ${contextType} and its context
• Discussing progress, status, and next steps  
• Exploring the content and objectives
• Planning implementation approaches
• Troubleshooting issues or challenges

What would you like to work on together?`;
    }

    // Generic responses for casual conversation
    if (messageLower.includes('whats up') || messageLower.includes("what's up") || messageLower.includes('sup')) {
        return `I'm here and ready to help with your ${contextType}! ${context.includes('Title:') ? `We're working on "${context.match(/Title: ([^\n]*)/)?.[1] || contextId}".` : ''} 

What aspect would you like to explore or discuss?`;
    }

    // Default intelligent response
    return getDefaultContextualResponse(message, context, contextType, contextId);
}

function getStatusAdvice(status: string): string {
    switch (status.toLowerCase()) {
        case 'complete':
        case 'completed':
            return 'Great! This work is finished. You might want to review outcomes or plan follow-up work.';
        case 'in_progress':
        case 'active':
            return 'This is currently being worked on. I can help with planning next steps or troubleshooting.';
        case 'planning':
            return 'This is in the planning phase. I can help break down requirements or set up execution.';
        case 'blocked':
            return 'This appears to be blocked. I can help identify issues or alternative approaches.';
        default:
            return 'I can help you understand what this status means and suggest next actions.';
    }
}

function getContextSpecificHelp(contextType: string, context: string): string {
    switch (contextType) {
        case 'loop':
            return `• Understand the execution context and objectives
• Review progress and current status
• Discuss implementation approaches
• Explore related tasks and dependencies
• Plan next steps and milestones`;
        case 'task':
            return `• Break down the task into actionable steps
• Understand requirements and acceptance criteria
• Explore implementation options
• Track progress and blockers
• Connect with related work`;
        case 'phase':
            return `• Overview of phase objectives and scope
• Review constituent projects and tasks
• Understand dependencies and timelines
• Track overall progress and milestones
• Plan resource allocation and priorities`;
        default:
            return `• Understand the context and objectives
• Review current status and progress
• Discuss implementation approaches
• Explore related work and dependencies
• Plan effective next steps`;
    }
}

function getNextStepsAdvice(contextType: string, context: string): string {
    if (context.includes('Status: complete')) {
        return `Since this ${contextType} is complete, here are some potential next steps:

• Review outcomes and lessons learned
• Document key insights or decisions
• Plan follow-up work or iterations
• Share results with stakeholders
• Archive or organize for future reference

What aspect of completion would you like to focus on?`;
    }

    return `For next steps with this ${contextType}, consider:

• **Immediate actions**: What can be done right now?
• **Dependencies**: What needs to happen first?
• **Resources**: What tools, information, or help is needed?
• **Timeline**: What are the key milestones or deadlines?
• **Success criteria**: How will you know when it's done?

Which of these areas would you like to explore first?`;
}

function getDefaultContextualResponse(message: string, context: string, contextType: string, contextId: string): string {
    const hasRichContext = context.includes('Title:');
    
    if (hasRichContext) {
        const title = context.match(/Title: ([^\n]*)/)?.[1] || contextId;
        return `I understand you're asking about "${title}". 

Based on the ${contextType} context, I can help you with:
• Understanding the objectives and scope
• Discussing implementation approaches  
• Reviewing progress and status
• Planning next steps
• Troubleshooting challenges

Could you be more specific about what aspect you'd like to explore? Or feel free to ask me anything about this work!`;
    }

    return `I'm here to help with this ${contextType}. I can assist with:

• Understanding the context and objectives
• Discussing progress and status
• Exploring implementation approaches
• Planning next steps and milestones
• Answering questions about the work

What would you like to know or discuss about "${contextId}"?`;
}

// --- Parsing and Stringifying ---
function parseChat(content: string, usesChatSection: boolean = false): ChatMessage[] {
    let chatContent = content;
    
    if (usesChatSection) {
        const chatMatch = content.match(/## 💬 Chat\n([\s\S]*?)(?=\n## |$)/);
        chatContent = chatMatch ? chatMatch[1] : '';
    }
    
    const messages: ChatMessage[] = [];
    const messageBlocks = chatContent.split('- timestamp:').slice(1);

    for (const block of messageBlocks) {
        const lines = block.split('\n');
        let timestamp = '';
        let speaker = '';
        let message = '';
        let messageStarted = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!timestamp && !trimmedLine.startsWith('speaker:') && !trimmedLine.startsWith('message:')) {
                timestamp = trimmedLine;
            } else if (trimmedLine.startsWith('speaker: ')) {
                speaker = trimmedLine.replace('speaker: ', '');
            } else if (trimmedLine.startsWith('message: ')) {
                message = trimmedLine.replace('message: ', '');
                messageStarted = true;
            } else if (messageStarted && trimmedLine) {
                message += '\n' + line; // Preserve original spacing for multiline messages
            }
        }

        if (timestamp && speaker && (speaker === 'user' || speaker === 'ora')) {
            messages.push({
                timestamp: timestamp,
                speaker: speaker as 'user' | 'ora',
                message: message.trim(),
            });
        }
    }
    return messages;
}

function stringifyMessage(message: ChatMessage): string {
    return `
- timestamp: ${message.timestamp}
  speaker: ${message.speaker}
  message: ${message.message}
`;
}

// --- API Handlers ---

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get('contextType');
    const contextId = searchParams.get('contextId');
    const filePath = searchParams.get('filePath') || undefined;

    if (!contextType || !contextId) {
        return NextResponse.json({ message: 'Missing contextType or contextId parameter' }, { status: 400 });
    }

    try {
        let chatFilePath: string;
        let usesChatSection = false;

        if (filePath) {
            // Try to read from the provided file path and look for ## 💬 Chat section
            chatFilePath = getChatFilePath(contextType, contextId, filePath);
            usesChatSection = true;
        } else {
            // Fallback to dedicated chat file
            chatFilePath = getChatFilePath(contextType, contextId);
        }

        try {
            const content = await fs.readFile(chatFilePath, 'utf-8');
            const messages = parseChat(content, usesChatSection);
            return NextResponse.json(messages);
        } catch (error) {
            if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                return NextResponse.json([]); // No chat history yet
            }
            throw error;
        }
    } catch (error) {
        console.error('Failed to get contextual chat:', error);
        return NextResponse.json({ message: `Failed to get chat for ${contextType} ${contextId}` }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { contextType, contextId, message, filePath } = await request.json();

    if (!contextType || !contextId || !message) {
        return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    
    const newMessage: ChatMessage = {
        timestamp: new Date().toISOString(),
        ...message,
    };

    try {
        const messageString = stringifyMessage(newMessage);

        if (filePath) {
            // Append to the ## 💬 Chat section of the provided file
            const fullFilePath = path.join(BASE_DIR, filePath);
            try {
                await mutationEngine.appendToSection(fullFilePath, '## 💬 Chat', messageString, contextId);
            } catch (error) {
                if (error instanceof Error && error.message.includes('Section "## 💬 Chat" not found')) {
                    // Create the Chat section if it doesn't exist
                    const content = await fs.readFile(fullFilePath, 'utf-8');
                    const updatedContent = content + '\n\n## 💬 Chat\n' + messageString;
                    await fs.writeFile(fullFilePath, updatedContent, 'utf-8');
                } else {
                    throw error;
                }
            }
        } else {
            // Fallback to dedicated chat file
            const chatFilePath = getChatFilePath(contextType, contextId);
            await fs.mkdir(path.dirname(chatFilePath), { recursive: true });
            
            // For dedicated chat files, we append directly
            await fs.appendFile(chatFilePath, messageString, 'utf-8');
        }
        
        // Generate AI response if message is from user
        if (newMessage.speaker === 'user') {
            try {
                const aiResponse = await generateAIResponse(newMessage.message, contextType, contextId, filePath);
                const aiMessage: ChatMessage = {
                    timestamp: new Date().toISOString(),
                    speaker: 'ora',
                    message: aiResponse
                };

                // Store AI response
                const aiMessageString = stringifyMessage(aiMessage);
                if (filePath) {
                    try {
                        await mutationEngine.appendToSection(path.join(BASE_DIR, filePath), '## 💬 Chat', aiMessageString, contextId);
                    } catch (sectionError) {
                        console.error('Failed to append to chat section, trying to create section:', sectionError);
                        // Try to create the Chat section if it doesn't exist
                        const fullFilePath = path.join(BASE_DIR, filePath);
                        const content = await fs.readFile(fullFilePath, 'utf-8');
                        const updatedContent = content + '\n\n## 💬 Chat\n' + aiMessageString;
                        await fs.writeFile(fullFilePath, updatedContent, 'utf-8');
                    }
                } else {
                    const chatFilePath = getChatFilePath(contextType, contextId);
                    await fs.mkdir(path.dirname(chatFilePath), { recursive: true });
                    await fs.appendFile(chatFilePath, aiMessageString, 'utf-8');
                }

                // Log AI interaction (non-blocking)
                try {
                    await logChatInteraction(aiResponse, 'ora', contextType, contextId, filePath);
                } catch (logError) {
                    console.error('Failed to log AI chat interaction:', logError);
                }

                console.log(`✅ AI response generated and stored for ${contextType}:${contextId}`);

            } catch (error) {
                console.error('Failed to generate AI response:', error);
                // Generate a simple fallback response
                try {
                    const fallbackMessage: ChatMessage = {
                        timestamp: new Date().toISOString(),
                        speaker: 'ora',
                        message: `I'm here to help with this ${contextType}. Sorry, I had a brief issue generating a detailed response. Could you please try asking your question again?`
                    };
                    const fallbackString = stringifyMessage(fallbackMessage);
                    
                    if (filePath) {
                        const fullFilePath = path.join(BASE_DIR, filePath);
                        const content = await fs.readFile(fullFilePath, 'utf-8');
                        if (content.includes('## 💬 Chat')) {
                            await mutationEngine.appendToSection(fullFilePath, '## 💬 Chat', fallbackString, contextId);
                        } else {
                            const updatedContent = content + '\n\n## 💬 Chat\n' + fallbackString;
                            await fs.writeFile(fullFilePath, updatedContent, 'utf-8');
                        }
                    }
                    console.log(`⚠️ Fallback response provided for ${contextType}:${contextId}`);
                } catch (fallbackError) {
                    console.error('Failed to provide fallback response:', fallbackError);
                }
            }
        }

        // Log the interaction (non-blocking)
        try {
            await logChatInteraction(
                newMessage.message,
                newMessage.speaker,
                contextType,
                contextId,
                filePath
            );
        } catch (logError) {
            console.error('Failed to log chat interaction:', logError);
            // Continue with the request even if logging fails
            // This ensures chat functionality works even with logging issues
        }
        
        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error('Failed to post contextual chat message:', error);
        return NextResponse.json({ 
            message: `Failed to post chat for ${contextType} ${contextId}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
} 