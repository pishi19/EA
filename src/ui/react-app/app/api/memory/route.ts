import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

interface MemoryTrace {
    description: string;
    timestamp: string;
    status: 'completed' | 'executed';
    executor: 'user' | 'system';
    output?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const loopId = searchParams.get('loopId');

    if (!loopId) {
        return NextResponse.json({ message: 'Missing loopId' }, { status: 400 });
    }

    try {
        const loopFilePath = path.join(process.cwd(), '..', '..', 'runtime', 'loops', `${loopId}.md`);
        const fileContent = await fs.readFile(loopFilePath, 'utf-8');
        const { content } = matter(fileContent);

        const memoryTraceRegex = /```json:memory\n([\s\S]*?)\n```/g;
        let match;
        const traces: MemoryTrace[] = [];

        while ((match = memoryTraceRegex.exec(content)) !== null) {
            try {
                traces.push(JSON.parse(match[1]));
            } catch (error) {
                console.error('Failed to parse memory trace JSON:', error);
            }
        }

        return NextResponse.json(traces);

    } catch (error) {
        console.error(`Failed to get memory traces for loop ${loopId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get memory traces', error: errorMessage }, { status: 500 });
    }
} 