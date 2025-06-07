import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { matterOptions } from '@/lib/yaml-engine';

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const LOOPS_DIR = path.join(BASE_DIR, 'runtime', 'loops');

export async function GET() {
    try {
        const files = await fs.readdir(LOOPS_DIR);
        
        const loopFilesPromises = files
            .filter(file => file.endsWith('.md'))
            .map(async (file) => {
                try {
                    const filePath = path.join(LOOPS_DIR, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const { data } = matter(content, matterOptions);
                    
                    return {
                        id: data.id || file, // Use frontmatter id or fallback to filename
                        name: data.name || file.replace('.md', ''), // Use frontmatter name or fallback to filename
                    };
                } catch {
                    // If reading or parsing fails, fallback to filename
                    return {
                        id: file,
                        name: file.replace('.md', ''),
                    };
                }
            });

        const loopFiles = await Promise.all(loopFilesPromises);

        return NextResponse.json(loopFiles);
    } catch (error) {
        console.error('Failed to get loops:', error);
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json([]); // No loops directory found, return empty array
        }
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: 'Failed to get loops', error: errorMessage }, { status: 500 });
    }
} 