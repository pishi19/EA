import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const LOOPS_DIR = path.join(BASE_DIR, 'runtime/loops');

interface ArtefactFullContent {
    frontmatter: Record<string, any>;
    sections: {
        objectives?: string;
        tasks?: string;
        executionLog?: string;
        memoryTrace?: string;
        systemContext?: string;
        [key: string]: string | undefined;
    };
    rawContent: string;
}

// Parse markdown content into sections
function parseContentSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Split content by markdown headers
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
        if (line.match(/^#{1,6}\s+/)) {
            // Save previous section
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            
            // Start new section
            const headerText = line.replace(/^#{1,6}\s+/, '').toLowerCase();
            currentSection = getSectionKey(headerText);
            currentContent = [line]; // Include the header
        } else {
            currentContent.push(line);
        }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
}

// Map header text to section keys
function getSectionKey(headerText: string): string {
    const text = headerText.toLowerCase();
    
    if (text.includes('objective')) return 'objectives';
    if (text.includes('task')) return 'tasks';
    if (text.includes('execution') || text.includes('log')) return 'executionLog';
    if (text.includes('memory') || text.includes('trace')) return 'memoryTrace';
    if (text.includes('system') || text.includes('context')) return 'systemContext';
    if (text.includes('chat') || text.includes('conversation')) return 'chat';
    if (text.includes('purpose')) return 'purpose';
    if (text.includes('implementation')) return 'implementation';
    if (text.includes('result')) return 'results';
    
    // Return sanitized version of the header text as fallback
    return text.replace(/[^a-z0-9]/g, '');
}

async function loadArtefactContent(artefactId: string): Promise<ArtefactFullContent | null> {
    try {
        // Find the file - could be loop-* or task-*
        const files = await fs.readdir(LOOPS_DIR);
        const possibleFiles = files.filter(file => 
            file.includes(artefactId) || file.replace('.md', '') === artefactId
        );
        
        if (possibleFiles.length === 0) {
            return null;
        }
        
        const fileName = possibleFiles[0];
        const filePath = path.join(LOOPS_DIR, fileName);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(fileContent);
        
        // Parse content into sections
        const sections = parseContentSections(content);
        
        return {
            frontmatter,
            sections,
            rawContent: content
        };
        
    } catch (error) {
        console.error(`Failed to load artefact content for ${artefactId}:`, error);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const artefactId = searchParams.get('id');
        
        if (!artefactId) {
            return NextResponse.json(
                { message: 'Artefact ID is required' },
                { status: 400 }
            );
        }
        
        const content = await loadArtefactContent(artefactId);
        
        if (!content) {
            return NextResponse.json(
                { message: `Artefact content not found: ${artefactId}` },
                { status: 404 }
            );
        }
        
        return NextResponse.json(content);
        
    } catch (error) {
        console.error('Error in artefact-content API:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
} 