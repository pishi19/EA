import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

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

        // 1. Get all phases for the filter dropdown
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
                    // Continue to next file if one fails
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
            // Fallback to the most recent phase if none is active or selected
            activePhase = allPhasesData.length > 0 ? allPhasesData[0] : null;
        }
        
        if (!activePhase) {
            return NextResponse.json({ message: 'No phases found' }, { status: 404 });
        }
        
        const activePhaseFilePath = path.join(phasesDir, `phase-${activePhase.phase}.md`);
        const { content: activePhaseContentFile } = await parseMarkdownFile(activePhaseFilePath);
        const activePhaseContent = await marked(activePhaseContentFile);

        // 3. Get loops and workstreams for the active phase
        const loopFiles = await fs.readdir(loopsDir);
        const phaseLoops: any[] = [];
        const executionLogs: any[] = [];
        const workstreamsInPhase = new Set<string>();

        const logRegex = /-\s(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):\s(.*)/g;
        const simpleLogRegex = /-\s(\d{4}-\d{2}-\d{2}):\s(.*)/g;

        for (const file of loopFiles) {
            if (file.endsWith('.md')) {
                const filePath = path.join(loopsDir, file);
                const { metadata, content } = await parseMarkdownFile(filePath);
                if (String(metadata.phase) === String(activePhase.phase)) {
                    phaseLoops.push(metadata);
                    if (metadata.workstream) {
                        workstreamsInPhase.add(metadata.workstream);
                    }

                    const logContentMatch = content.match(/## 🧾 Execution Log\n\n([\s\S]*)/);
                    if (logContentMatch) {
                        const logContent = logContentMatch[1];
                        let match;
                        while ((match = logRegex.exec(logContent)) !== null) {
                            executionLogs.push({
                                timestamp: match[1],
                                description: match[2],
                                source: metadata.title,
                                uuid: metadata.uuid
                            });
                        }
                        while ((match = simpleLogRegex.exec(logContent)) !== null) {
                            executionLogs.push({
                                timestamp: match[1],
                                description: match[2],
                                source: metadata.title,
                                uuid: metadata.uuid
                            });
                        }
                    }
                }
            }
        }
        
        executionLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // 4. Get roadmap lineage
        const roadmap = allPhasesData
            .map(p => ({ phase: p.phase, status: p.status || 'complete' }))
            .sort((a,b) => a.phase - b.phase);

        return NextResponse.json({ 
            activePhase, 
            activePhaseContent, 
            phaseLoops, 
            executionLogs, 
            roadmap,
            allPhases: allPhasesData.map(p => p.phase),
            workstreamsInPhase: Array.from(workstreamsInPhase)
        });

    } catch (error) {
        console.error('Failed to get system view data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get system view data', error: errorMessage }, { status: 500 });
    }
} 