import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Force dynamic rendering since we use request.url for search params
export const dynamic = 'force-dynamic';

// --- Path Resolution ---
const BASE_DIR = path.resolve(process.cwd(), '../../..');
const LOOPS_DIR = path.join(BASE_DIR, 'runtime/loops');

interface LoopMetadata {
  id: string;
  name: string;
  title: string;
  phase: string;
  workstream: string;
  status: string;
  score: number;
  tags: string[];
  created: string;
  uuid: string;
  summary: string;
  filePath: string;
}

// --- Helper Functions ---
async function loadLoopMetadata(fileName: string): Promise<LoopMetadata | null> {
  try {
    const filePath = path.join(LOOPS_DIR, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Extract summary from content (first few lines after frontmatter)
    const contentLines = content.trim().split('\n');
    const summary = contentLines
      .slice(0, 3)
      .join(' ')
      .replace(/#+\s*/g, '')
      .substring(0, 200) + '...';

    const loopId = fileName.replace('.md', '');
    
    return {
      id: loopId,
      name: loopId,
      title: frontmatter.title || loopId,
      phase: frontmatter.phase || '0.0',
      workstream: frontmatter.workstream || 'unknown',
      status: frontmatter.status || 'unknown',
      score: frontmatter.score || 0.0,
      tags: frontmatter.tags || [],
      created: frontmatter.created || new Date().toISOString().split('T')[0],
      uuid: frontmatter.uuid || loopId,
      summary: frontmatter.summary || summary,
      filePath: `runtime/loops/${fileName}`,
    };
  } catch (error) {
    console.error(`Failed to load loop metadata for ${fileName}:`, error);
    return null;
  }
}

async function loadAllLoops(): Promise<LoopMetadata[]> {
  try {
    const files = await fs.readdir(LOOPS_DIR);
    const loopFiles = files.filter(file => 
      file.startsWith('loop-') && file.endsWith('.md')
    );

    const loops = await Promise.all(
      loopFiles.map(fileName => loadLoopMetadata(fileName))
    );

    return loops.filter((loop): loop is LoopMetadata => loop !== null);
  } catch (error) {
    console.error('Failed to load loops directory:', error);
    return [];
  }
}

// --- API Handlers ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loopId = searchParams.get('id');

    if (loopId) {
      // Load specific loop
      const fileName = loopId.endsWith('.md') ? loopId : `${loopId}.md`;
      const loop = await loadLoopMetadata(fileName);
      
      if (!loop) {
        return NextResponse.json(
          { message: `Loop not found: ${loopId}` },
          { status: 404 }
        );
      }

      return NextResponse.json(loop);
    } else {
      // Load all loops
      const loops = await loadAllLoops();
      return NextResponse.json(loops);
    }
  } catch (error) {
    console.error('Error in demo-loops API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 