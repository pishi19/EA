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

export async function POST(request: Request) {
    const { loopId } = await request.json();

    if (!loopId) {
        return NextResponse.json({ message: 'Missing loopId' }, { status: 400 });
    }

    try {
        const loopFilePath = path.resolve(process.cwd(), '..', '..', '..', 'runtime', 'loops', `${loopId}.md`);
        const fileContent = await fs.readFile(loopFilePath, 'utf-8');
        const { data: metadata, content } = matter(fileContent);
        
        const memoryTraceRegex = /## 🧠 Memory Trace\n\n([\s\S]*?)(?=\n## |$)/;
        const contextRegex = /## Context\n\n([\s\S]*?)(?=\n## |$)/;
        const purposeRegex = /## Purpose\n\n([\s\S]*?)(?=\n## |$)/;
        
        let loopContext = '';
        const memoryMatch = content.match(memoryTraceRegex);
        if (memoryMatch) {
            loopContext = memoryMatch[1];
        } else {
            const contextMatch = content.match(contextRegex);
            if (contextMatch) {
                loopContext = contextMatch[1];
            } else {
                const purposeMatch = content.match(purposeRegex);
                if (purposeMatch) {
                    loopContext = purposeMatch[1];
                }
            }
        }

        const summary = metadata.summary || '';

        const prompt = `What task should be added next based on these memory traces and this loop context?

Summary:
${summary}

Context:
${loopContext}`;

        // Simulate GPT call
        const suggestion = `Based on the summary and context, a good next task would be to "Implement the 'Promote to Task' feature".`;
        
        console.log("Generated Prompt:", prompt);

        return NextResponse.json({ suggestion });

    } catch (error) {
        console.error(`Failed to get suggestion for loop ${loopId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get suggestion', error: errorMessage }, { status: 500 });
    }
} 