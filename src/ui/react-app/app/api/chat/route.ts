import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { mutationEngine } from '@/system/mutation-engine';

// --- Types ---
export interface ChatMessage {
    timestamp: string;
    speaker: 'user' | 'ora';
    message: string;
}

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const RUNTIME_DIR = path.join(BASE_DIR, 'runtime');

function getChatFilePath(scope: string, params: Record<string, string>): string {
    switch (scope) {
        case 'workstream':
            return path.join(RUNTIME_DIR, 'workstreams', params.name, 'chat.md');
        case 'program':
            return path.join(RUNTIME_DIR, 'workstreams', params.workstream, 'programs', params.program, 'chat.md');
        case 'project':
            return path.join(RUNTIME_DIR, 'workstreams', params.workstream, 'programs', params.program, 'projects', params.project, 'chat.md');
        case 'task':
             // For tasks, the chat is part of the task file itself. This needs a different handler.
             // We'll assume task files are in a specific, resolvable location for now.
             // This part will need to be more robust.
            return path.join(RUNTIME_DIR, 'loops', `${params.id}.md`); // Placeholder
        default:
            throw new Error(`Invalid chat scope: ${scope}`);
    }
}

// --- Parsing and Stringifying ---
function parseChat(content: string, scope: string): ChatMessage[] {
    if (scope === 'task') {
        const chatMatch = content.match(/## 💬 Chat\n([\s\S]*)/);
        content = chatMatch ? chatMatch[1] : '';
    }
    
    const messages: ChatMessage[] = [];
    const messageBlocks = content.split('- timestamp:').slice(1);

    for (const block of messageBlocks) {
        const timestampMatch = block.match(/(.*?)\n/);
        const speakerMatch = block.match(/speaker: (user|ora)/);
        const messageMatch = block.match(/message: ([\s\S]*)/);

        if (timestampMatch && speakerMatch && messageMatch) {
            messages.push({
                timestamp: timestampMatch[1].trim(),
                speaker: speakerMatch[1] as 'user' | 'ora',
                message: messageMatch[1].trim(),
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
    const scope = searchParams.get('scope');
    const params = Object.fromEntries(searchParams.entries());

    if (!scope) {
        return NextResponse.json({ message: 'Missing scope parameter' }, { status: 400 });
    }

    try {
        const filePath = getChatFilePath(scope, params);
        const content = await fs.readFile(filePath, 'utf-8');
        const messages = parseChat(content, scope);
        return NextResponse.json(messages);
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json([]); // No chat history yet
        }
        console.error('Failed to get chat:', error);
        return NextResponse.json({ message: `Failed to get chat for ${scope}` }, { status: 500 });
    }
}


export async function POST(request: Request) {
    const { scope, params, message } = await request.json();

    if (!scope || !params || !message) {
        return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    
    const newMessage: ChatMessage = {
        timestamp: new Date().toISOString(),
        ...message,
    };

    try {
        const filePath = getChatFilePath(scope, params);
        const messageString = stringifyMessage(newMessage);

        if (scope === 'task') {
            await mutationEngine.appendToSection(filePath, '## 💬 Chat', messageString, params.id);
        } else {
            // For non-task scopes, we just append to the file. 
            // This could be its own mutation type, but for now, we'll handle it here.
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.appendFile(filePath, messageString, 'utf-8');
            // We should also add this to the mutation log, but this will do for now.
        }
        
        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error('Failed to post chat message:', error);
        return NextResponse.json({ message: `Failed to post chat for ${scope}` }, { status: 500 });
    }
} 