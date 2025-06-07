import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { marked } from 'marked';
import { Phase, Loop, EnrichedPhase, EnrichedLoop } from '@/lib/types';
import { matterOptions } from '@/lib/yaml-engine';
import { PATHS } from '@/lib/path-utils';

// --- Data Enrichment Functions ---

async function getEnrichedLoop(loopId: string, phase: number): Promise<EnrichedLoop | null> {
    try {
        // Guard against undefined/null/empty loop IDs
        if (!loopId || typeof loopId !== 'string' || loopId.trim() === '') {
            console.warn(`Invalid loop ID: ${loopId}`);
            return null;
        }
        
        const filePath = path.join(PATHS.LOOPS_DIR, loopId);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent, matterOptions);
        return {
            id: data.id || loopId,
            title: data.title || data.name || loopId.replace('.md', ''),
            phase: parseFloat(data.phase) || phase,
            status: data.status || 'unknown',
            workstream: data.workstream || 'unassigned',
            score: data.score || 0,
            tags: data.tags || [],
            summary: data.summary || '',
            content: await marked(content),
            created: data.created || '',
            type: data.type || 'execution', // Default to execution if not specified
        };
    } catch (error) {
        console.error(`Error processing loop ${loopId}:`, error);
        return null; // Return null if a loop file is defined but not found/readable
    }
}

async function getEnrichedPhase(phase: Phase): Promise<EnrichedPhase> {
    // Safely process loops with better error handling
    const loopPromises = (phase.loops || [])
        .filter(loop => loop && loop.id) // Filter out invalid loop objects
        .map(loop => getEnrichedLoop(loop.id, phase.phase));
    
    const enrichedLoops = (await Promise.allSettled(loopPromises))
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<EnrichedLoop>).value);

    let phaseContent = '';
    try {
        const phaseFilePath = path.join(PATHS.PHASES_DIR, `phase-${phase.phase}.md`);
        const fileContent = await fs.readFile(phaseFilePath, 'utf-8');
        const { content } = matter(fileContent, matterOptions);
        phaseContent = await marked(content);
    } catch (error) {
        // Phase content is optional, so we can ignore errors here
        console.debug(`Phase content not found for phase ${phase.phase}`);
    }

    return {
        ...phase,
        content: phaseContent,
        loops: enrichedLoops,
    };
}


// --- Helper function to scan loop files for phase associations ---
async function getLoopsForPhase(phaseNumber: number): Promise<string[]> {
    try {
        const loopFiles = await fs.readdir(PATHS.LOOPS_DIR);
        const relevantLoops: string[] = [];
        
        for (const file of loopFiles) {
            if (!file.endsWith('.md')) continue;
            
            try {
                const filePath = path.join(PATHS.LOOPS_DIR, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const { data } = matter(fileContent, matterOptions);
                
                // Check if loop is associated with this phase
                if (data.phase && parseFloat(data.phase) === phaseNumber) {
                    relevantLoops.push(file);
                }
            } catch (error) {
                // Skip files that can't be read or parsed
                console.debug(`Skipping loop file ${file}:`, error);
                continue;
            }
        }
        
        return relevantLoops;
    } catch (error) {
        console.error('Error scanning loop files:', error);
        return [];
    }
}

// --- API Handler ---
export async function GET() {
    try {
        const yamlContent = await fs.readFile(PATHS.ROADMAP_YAML_PATH, 'utf-8');
        const roadmapData = yaml.load(yamlContent) as { phases: Phase[] };
        
        // Process phases with improved loop handling
        const phasesWithLoops = await Promise.all(
            roadmapData.phases.map(async (p) => {
                // Start with explicitly defined loops from YAML
                let loops: Array<{ id: string; title: string; phase: number }> = [];
                
                if (p.loops && p.loops.length > 0) {
                    loops = p.loops
                        .filter((loopId: any) => loopId != null && loopId !== undefined && String(loopId).trim() !== '')
                        .map((loopId: any) => ({ 
                            id: String(loopId), 
                            title: String(loopId).replace('.md',''), 
                            phase: p.phase 
                        }));
                } else {
                    // Fallback: scan for loops that reference this phase
                    const discoveredLoops = await getLoopsForPhase(p.phase);
                    loops = discoveredLoops.map(loopId => ({
                        id: loopId,
                        title: loopId.replace('.md', ''),
                        phase: p.phase
                    }));
                }
                
                return {
                    ...p,
                    loops
                };
            })
        );

        const enrichedPhasesPromises = phasesWithLoops.map(getEnrichedPhase);
        let phases: EnrichedPhase[] = await Promise.all(enrichedPhasesPromises);

        phases.sort((a, b) => a.phase - b.phase);

        return NextResponse.json(phases);

    } catch (error) {
        console.error('Failed to get roadmap data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get roadmap data', error: errorMessage }, { status: 500 });
    }
} 