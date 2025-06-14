import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { mutationEngine } from '../../../../../system/mutation-engine';
import { matterOptions } from '@/lib/yaml-engine';
import { logChatInteraction } from '@/lib/interaction-logger';
import { 
    generateWorkstreamChatResponse, 
    buildWorkstreamLLMContext,
    WorkstreamLLMContext,
    PhaseContext,
    ArtefactContext
} from '@/lib/workstream-llm-context';
import { WORKSTREAM_REGISTRY, WorkstreamConfig } from '@/lib/workstream-api';

// Helper to extract workstream from file path
function extractWorkstreamFromPath(filePath: string): string {
    const match = filePath.match(/workstreams\/([^\/]+)/);
    return match ? match[1] : 'ora';
}

// Helper to create workstream context
function createWorkstreamContext(workstream: string) {
    const config = WORKSTREAM_REGISTRY[workstream] || WORKSTREAM_REGISTRY.ora;
    return {
        workstream,
        config,
        dataPath: config.dataPath,
        isValid: true,
        source: 'default' as const
    };
}

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

// --- Enhanced AI Response Generation with Workstream Context ---
async function generateAIResponse(userMessage: string, contextType: string, contextId: string, filePath?: string): Promise<string> {
    try {
        // Extract workstream from filePath or use default
        let workstream = 'ora'; // default
        if (filePath) {
            workstream = extractWorkstreamFromPath(filePath) || 'ora';
        }

        // Build workstream context
        const workstreamContext = createWorkstreamContext(workstream);

        // Load artefact context if available
        let artefactContext: ArtefactContext | null = null;
        if (filePath) {
            try {
                const fullPath = path.join(BASE_DIR, filePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                const parsed = matter(content, matterOptions);
                
                artefactContext = {
                    id: contextId,
                    title: parsed.data.title || contextId,
                    status: parsed.data.status || 'unknown',
                    phase: parsed.data.phase || 'unknown',
                    workstream: parsed.data.workstream || workstream,
                    tags: parsed.data.tags || [],
                    summary: content.substring(0, 300) + '...',
                    created: parsed.data.created || new Date().toISOString()
                };
            } catch (error) {
                console.warn('Could not load artefact context:', error);
            }
        }

        // Load phase context (simplified for now)
        let phaseContext: PhaseContext | null = null;
        if (artefactContext?.phase && artefactContext.phase !== 'unknown') {
            phaseContext = {
                phase: artefactContext.phase,
                strategicFocus: `Phase ${artefactContext.phase} objectives`,
                keyObjectives: [`Complete ${contextType} tasks`, 'Maintain quality standards'],
                currentChallenges: ['Resource coordination', 'Timeline management'],
                successCriteria: ['All tasks completed', 'Quality standards met'],
                dependencies: ['Previous phase completion'],
                nextPhasePreparation: 'Planning next phase activities'
            };
        }

        // Generate intelligent response using workstream-aware LLM context
        const response = await generateWorkstreamChatResponse(
            userMessage,
            workstreamContext,
            phaseContext,
            artefactContext
        );

        return response.message;

    } catch (error) {
        console.error('Error generating AI response:', error);
        return `I'm here to help with your ${contextType}. Could you please rephrase your question or let me know what specific assistance you need?`;
    }
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