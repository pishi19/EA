import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { mutationEngine } from '../../../../../../system/mutation-engine';
import { logMemoryExecutionInteraction } from '@/lib/interaction-logger';

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const RUNTIME_DIR = path.join(BASE_DIR, 'runtime');

function getContextFilePath(contextType: string, contextId: string, filePath?: string): string {
    if (filePath) {
        return path.join(BASE_DIR, filePath);
    }
    
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

function formatLogEntry(message: string, section: 'memory' | 'execution'): string {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    if (section === 'memory') {
        return `
- ${date}: 🤖 GPT Response logged: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}
`;
    } else {
        return `
- ${date}: 🤖 GPT Response: ${message}
`;
    }
}

// --- API Handler ---
export async function POST(request: Request) {
    const { contextType, contextId, message, section, filePath } = await request.json();

    if (!contextType || !contextId || !message || !section) {
        return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    if (section !== 'memory' && section !== 'execution') {
        return NextResponse.json({ message: 'Invalid section. Must be "memory" or "execution"' }, { status: 400 });
    }

    try {
        const targetFilePath = getContextFilePath(contextType, contextId, filePath);
        const sectionHeader = section === 'memory' ? '## 🧠 Memory Trace' : '## 🧾 Execution Log';
        const logEntry = formatLogEntry(message, section);

        try {
            await mutationEngine.appendToSection(targetFilePath, sectionHeader, logEntry, contextId);
        } catch (error) {
            if (error instanceof Error && error.message.includes(`Section "${sectionHeader}" not found`)) {
                // Create the section if it doesn't exist
                const content = await fs.readFile(targetFilePath, 'utf-8');
                const updatedContent = content + '\n\n' + sectionHeader + '\n' + logEntry;
                await fs.writeFile(targetFilePath, updatedContent, 'utf-8');
            } else {
                throw error;
            }
        }
        
        // Log the interaction
        try {
            await logMemoryExecutionInteraction(
                section,
                message,
                contextType,
                contextId,
                filePath
            );
        } catch (logError) {
            console.error('Failed to log memory/execution interaction:', logError);
            // Don't fail the request if logging fails
        }
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully logged to ${section} section` 
        }, { status: 200 });
    } catch (error) {
        console.error('Failed to log message to section:', error);
        return NextResponse.json({ 
            message: `Failed to log to ${section} section: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
} 