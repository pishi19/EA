import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PhaseInfo {
    id: string;
    number: string;
    title: string;
    fullTitle: string;
    status?: string;
}

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const ROADMAP_FILE = path.join(BASE_DIR, 'runtime/docs/roadmap.md');

export async function GET(request: NextRequest) {
    try {
        const phases = await getAllPhases();
        return NextResponse.json(phases);
    } catch (error) {
        console.error('Error fetching phases:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function getAllPhases(): Promise<PhaseInfo[]> {
    try {
        const roadmapContent = await fs.readFile(ROADMAP_FILE, 'utf-8');
        
        // Match all phase headers like "### Phase 11: Artefact Hierarchy, Filtering & Chat"
        const phasePattern = /### Phase (\d+): (.+?)$/gm;
        const phases: PhaseInfo[] = [];
        
        let match;
        while ((match = phasePattern.exec(roadmapContent)) !== null) {
            const phaseNumber = match[1];
            const phaseTitle = match[2].trim();
            const fullTitle = `Phase ${phaseNumber}: ${phaseTitle}`;
            
            phases.push({
                id: `phase-${phaseNumber}`,
                number: phaseNumber,
                title: phaseTitle,
                fullTitle: fullTitle,
                status: 'active' // Default status, could be enhanced to parse actual status
            });
        }
        
        return phases.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        
    } catch (error) {
        console.error('Error reading roadmap file:', error);
        return [];
    }
} 