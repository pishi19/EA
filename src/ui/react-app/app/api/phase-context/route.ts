import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PhaseContext {
    phase: string;
    strategicFocus: string;
    keyObjectives: string[];
    currentChallenges: string[];
    successCriteria: string[];
    dependencies: string[];
    nextPhasePreparation: string;
    owner: string;
    status: string;
}

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const ROADMAP_FILE = path.join(BASE_DIR, 'runtime/docs/roadmap.md');

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phase = searchParams.get('phase');

        if (!phase) {
            return NextResponse.json(
                { error: 'Phase parameter is required' },
                { status: 400 }
            );
        }

        const context = await getPhaseContext(phase);
        
        if (!context) {
            return NextResponse.json(
                { error: `Context not found for phase: ${phase}` },
                { status: 404 }
            );
        }

        return NextResponse.json(context);

    } catch (error) {
        console.error('Phase context error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function getPhaseContext(phase: string): Promise<PhaseContext | null> {
    try {
        const roadmapContent = await fs.readFile(ROADMAP_FILE, 'utf-8');
        
        // Parse phase context from refactored roadmap.md structure
        const phaseHeaderPattern = new RegExp(`### Phase ${phase}: (.+?)$`, 'm');
        const headerMatch = roadmapContent.match(phaseHeaderPattern);
        
        if (!headerMatch) {
            console.log(`No phase header found for phase ${phase}`);
            return null;
        }

        const phaseTitle = headerMatch[1].trim();
        const fullPhaseTitle = `Phase ${phase}: ${phaseTitle}`;
        
        // Extract the entire phase section until the next phase or section
        const phasePattern = new RegExp(
            `### Phase ${phase}: ${phaseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=### Phase \\d+:|## |$)`, 
            'i'
        );
        const phaseMatch = roadmapContent.match(phasePattern);
        
        if (!phaseMatch) {
            console.log(`No phase content found for phase ${phase}`);
            return null;
        }

        const phaseContent = phaseMatch[1];
        
        // Parse the new simplified structure
        const objectives = extractObjectives(phaseContent);
        const owner = extractSimpleField(phaseContent, 'Owner');
        const status = extractSimpleField(phaseContent, 'Status');
        const dependencies = extractSimpleField(phaseContent, 'Dependencies');

        // Create context with the new structure, providing fallbacks for UI compatibility
        return {
            phase: fullPhaseTitle,
            strategicFocus: objectives.length > 0 ? objectives[0] : phaseTitle, // Use first objective as strategic focus
            keyObjectives: objectives,
            currentChallenges: [], // Not available in new structure
            successCriteria: [], // Not available in new structure
            dependencies: dependencies ? [dependencies] : [],
            nextPhasePreparation: '', // Not available in new structure
            owner: owner || 'TBD',
            status: status || 'Planning'
        };

    } catch (error) {
        console.error('Error reading roadmap file:', error);
        return null;
    }
}

function extractObjectives(content: string): string[] {
    const objectivesPattern = /\*\*Objectives:\*\*\s*([\s\S]*?)(?=\*\*\w+:|  -|\n\n|$)/;
    const match = content.match(objectivesPattern);
    
    if (!match) return [];
    
    const objectivesText = match[1];
    const objectives = objectivesText.match(/^- (.+)$/gm);
    
    return objectives ? objectives.map(obj => obj.replace(/^- /, '').trim()) : [];
}

function extractSimpleField(content: string, fieldName: string): string {
    const pattern = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`, 'i');
    const match = content.match(pattern);
    return match ? match[1].trim() : '';
} 