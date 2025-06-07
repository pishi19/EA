import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BASE_DIR = path.resolve(process.cwd(), '../../..');
const WORKSTREAMS_DIR = path.join(BASE_DIR, 'runtime', 'workstreams');

async function findTaskFiles(dir: string): Promise<string[]> {
    let taskFiles: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            taskFiles = taskFiles.concat(await findTaskFiles(fullPath));
        } else if (entry.name === 'tasks.md' || entry.name.endsWith('-tasks.md')) {
            taskFiles.push(path.relative(WORKSTREAMS_DIR, fullPath));
        }
    }
    return taskFiles;
}

export async function GET() {
    try {
        const taskFiles = await findTaskFiles(WORKSTREAMS_DIR);
        const fileOptions = taskFiles.map(file => ({
            id: file,
            name: file.replace(/\\/g, ' / '), // for windows paths
        }));
        return NextResponse.json(fileOptions);
    } catch (error) {
        console.error('Failed to get project task files:', error);
        return NextResponse.json({ message: 'Failed to get project task files' }, { status: 500 });
    }
} 