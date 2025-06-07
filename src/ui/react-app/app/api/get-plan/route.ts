import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

export async function GET() {
    try {
        const planPath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'Worksteams', 'roadmap', 'workstream_plan.md');
        const planContent = await fs.readFile(planPath, 'utf-8');
        const htmlContent = await marked(planContent);
        return NextResponse.json({ content: htmlContent });
    } catch (error) {
        console.error('Failed to get plan:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get plan', error: errorMessage }, { status: 500 });
    }
} 