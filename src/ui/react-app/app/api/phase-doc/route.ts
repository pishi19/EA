import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

// Force dynamic behavior for this route since we use request.url
export const dynamic = 'force-dynamic';

// Helper function to parse frontmatter and content
async function parseMarkdownFile(filePath: string) {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    return { metadata: data, content };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const selectedPhase = searchParams.get('phase');

        const phasesDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'phases');
        const loopsDir = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'loops');

        // 1. Get all phases
        const phaseFiles = await fs.readdir(phasesDir);
        const allPhasesData: any[] = [];
        for (const file of phaseFiles) {
            if (file.endsWith('.md') && file.startsWith('phase-')) {
                try {
                    const filePath = path.join(phasesDir, file);
                    const { metadata } = await parseMarkdownFile(filePath);
                    if (metadata.phase) {
                        allPhasesData.push(metadata);
                    }
                } catch (error) {
                    console.error(`Failed to parse phase file ${file}:`, error);
                }
            }
        }
        allPhasesData.sort((a,b) => b.phase - a.phase);

        // 2. Determine the phase to display
        let activePhase: any = null;
        if (selectedPhase) {
            activePhase = allPhasesData.find(p => String(p.phase) === selectedPhase);
        } else {
            activePhase = allPhasesData.find(p => p.status === 'in_progress');
        }

        if (!activePhase) {
            activePhase = allPhasesData.length > 0 ? allPhasesData[0] : null;
        }

        if (!activePhase) {
            return NextResponse.json({ message: 'No phases found' }, { status: 404 });
        }

        const activePhaseFilePath = path.join(phasesDir, `phase-${activePhase.phase}.md`);
        const { content: activePhaseContentFile } = await parseMarkdownFile(activePhaseFilePath);
        const activePhaseContent = await marked(activePhaseContentFile);

        // 3. Get loops for the active phase
        const loopFiles = await fs.readdir(loopsDir);
        const phaseLoops: any[] = [];
        const allTags = new Set<string>();

        for (const file of loopFiles) {
            if (file.endsWith('.md')) {
                const filePath = path.join(loopsDir, file);
                const { metadata, content } = await parseMarkdownFile(filePath);
                if (String(metadata.phase) === String(activePhase.phase)) {
                    phaseLoops.push({
                        ...metadata,
                        content: await marked(content)
                    });
                    if (metadata.tags && Array.isArray(metadata.tags)) {
                        metadata.tags.forEach((tag: string) => allTags.add(tag));
                    }
                }
            }
        }
        
        phaseLoops.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());


        return NextResponse.json({ 
            activePhase, 
            activePhaseContent, 
            phaseLoops,
            allPhases: allPhasesData.map(p => p.phase),
            allTags: Array.from(allTags)
        });

    } catch (error) {
        console.error('Failed to get phase doc data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get phase doc data', error: errorMessage }, { status: 500 });
    }
} 