import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { logInteraction } from '@/lib/interaction-logger';

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');

// --- API Handler ---
export async function POST(request: Request) {
    const { contextType, contextId, filePath } = await request.json();

    if (!contextType || !contextId) {
        return NextResponse.json({ message: 'Missing contextType or contextId parameter' }, { status: 400 });
    }

    try {
        if (!filePath) {
            return NextResponse.json({ message: 'Missing filePath parameter' }, { status: 400 });
        }

        const fullFilePath = path.join(BASE_DIR, filePath);
        
        // Check if file exists
        try {
            await fs.access(fullFilePath);
        } catch (error) {
            return NextResponse.json({ message: `File not found: ${filePath}` }, { status: 404 });
        }

        // Read the file content
        const content = await fs.readFile(fullFilePath, 'utf-8');
        
        // Check if chat section already exists
        if (content.includes('## 💬 Chat')) {
            return NextResponse.json({ message: 'Chat section already exists in this file' }, { status: 200 });
        }

        // Add the chat section to the end of the file
        const updatedContent = content + '\n\n## 💬 Chat\n\n';
        await fs.writeFile(fullFilePath, updatedContent, 'utf-8');
        
        // Log the interaction
        try {
            await logInteraction(
                'add-chat-section',
                `Added chat section to file: ${filePath}`,
                `Chat section successfully added to ${filePath}`,
                'ora',
                'api',
                { contextType, contextId, filePath, action: 'add-section' }
            );
        } catch (logError) {
            console.error('Failed to log add-section interaction:', logError);
        }
        
        return NextResponse.json({ 
            message: 'Chat section added successfully',
            filePath: filePath
        }, { status: 200 });
        
    } catch (error) {
        console.error('Failed to add chat section:', error);
        return NextResponse.json({ 
            message: `Failed to add chat section: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
    }
} 