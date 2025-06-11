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
        
        // Parse phase context from roadmap.md - capture full title
        const phaseHeaderPattern = new RegExp(`### Phase ${phase}: (.+?)$`, 'm');
        const headerMatch = roadmapContent.match(phaseHeaderPattern);
        const phaseTitle = headerMatch ? headerMatch[1].trim() : '';
        const fullPhaseTitle = phaseTitle ? `Phase ${phase}: ${phaseTitle}` : `Phase ${phase}`;
        
        // Parse phase context section
        const phasePattern = new RegExp(`### Phase ${phase}:([^#]+?)(?:#### LLM Prompt Context[\\s\\S]*?)(###|$)`, 'i');
        const match = roadmapContent.match(phasePattern);
        
        if (!match) {
            return null;
        }

        const contextSection = match[0];
        
        // Extract context fields
        const strategicFocus = extractField(contextSection, 'Strategic Focus');
        const keyObjectives = extractListField(contextSection, 'Key Objectives');
        const currentChallenges = extractListField(contextSection, 'Current Challenges');
        const successCriteria = extractListField(contextSection, 'Success Criteria');
        const dependencies = extractListField(contextSection, 'Dependencies');
        const nextPhasePreparation = extractField(contextSection, 'Next Phase Preparation');

        return {
            phase: fullPhaseTitle,
            strategicFocus,
            keyObjectives,
            currentChallenges,
            successCriteria,
            dependencies,
            nextPhasePreparation
        };

    } catch (error) {
        console.error('Error reading roadmap file:', error);
        return null;
    }
}

function extractField(content: string, fieldName: string): string {
    const pattern = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+?)(?=\\n\\*\\*|\\n\\n|$)`, 's');
    const match = content.match(pattern);
    return match ? match[1].trim() : '';
}

function extractListField(content: string, fieldName: string): string[] {
    const pattern = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n\\n(?!\\s*-)|$)`, 's');
    const match = content.match(pattern);
    
    if (!match) return [];
    
    const listContent = match[1];
    const items = listContent.match(/- (.+)/g);
    
    return items ? items.map(item => item.replace(/^- /, '').trim()) : [];
} 