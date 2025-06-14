import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { 
  withWorkstreamContext, 
  WorkstreamContext,
  createWorkstreamResponse,
  createWorkstreamErrorResponse,
  getWorkstreamArtefactsPath,
  listWorkstreamFiles,
  readWorkstreamFile,
  logWorkstreamOperation,
  hasWorkstreamPermission
} from '@/lib/workstream-api';

// Force dynamic rendering since we use request.url for search params
export const dynamic = 'force-dynamic';

interface LoopMetadata {
  id: string;
  name: string;
  title: string;
  phase: string;
  workstream: string;
  program?: string;
  status: string;
  score: number;
  tags: string[];
  created: string;
  uuid: string;
  summary: string;
  filePath: string;
  type?: string;
  origin?: string;
}

// --- Helper Functions ---
async function loadWorkstreamLoopMetadata(
  workstream: string, 
  fileName: string
): Promise<LoopMetadata | null> {
  try {
    const fileContent = await readWorkstreamFile(workstream, fileName);
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
      workstream: frontmatter.workstream || workstream,
      program: frontmatter.program,
      status: frontmatter.status || 'unknown',
      score: frontmatter.score || 0.0,
      tags: frontmatter.tags || [],
      created: frontmatter.created || new Date().toISOString().split('T')[0],
      uuid: frontmatter.uuid || loopId,
      summary: frontmatter.summary || summary,
      filePath: `runtime/workstreams/${workstream}/${fileName}`,
      type: frontmatter.type || 'task',
      origin: frontmatter.origin || 'file',
    };
  } catch (error) {
    console.error(`Failed to load loop metadata for ${fileName} in workstream ${workstream}:`, error);
    return null;
  }
}

async function loadAllWorkstreamLoops(workstream: string): Promise<LoopMetadata[]> {
  try {
    // Try to load from workstream-specific artefacts directory first
    let files: string[] = [];
    try {
      files = await listWorkstreamFiles(workstream, 'artefacts');
    } catch {
      // If no artefacts directory, try root workstream directory
      try {
        files = await listWorkstreamFiles(workstream);
      } catch {
        // If workstream doesn't exist, return empty array
        return [];
      }
    }

    const loopFiles = files.filter(file => 
      (file.startsWith('loop-') || file.startsWith('task-') || 
       file.startsWith('phase-') || file.startsWith('project-')) && file.endsWith('.md')
    );

    const loops = await Promise.all(
      loopFiles.map(fileName => {
        // Try artefacts directory first, then root
        return loadWorkstreamLoopMetadata(workstream, `artefacts/${fileName}`)
          .catch(() => loadWorkstreamLoopMetadata(workstream, fileName));
      })
    );

    return loops.filter(loop => loop !== null) as LoopMetadata[];
  } catch (error) {
    console.error(`Failed to load loops for workstream ${workstream}:`, error);
    return [];
  }
}

// Legacy fallback for existing loop files in runtime/loops
async function loadLegacyLoops(): Promise<LoopMetadata[]> {
  try {
    const BASE_DIR = path.resolve(process.cwd(), '../../..');
    const LOOPS_DIR = path.join(BASE_DIR, 'runtime/loops');
    const files = await fs.readdir(LOOPS_DIR);
    const loopFiles = files.filter(file => 
      (file.startsWith('loop-') || file.startsWith('task-') || 
       file.startsWith('phase-') || file.startsWith('project-')) && file.endsWith('.md')
    );

    const loops = await Promise.all(
      loopFiles.map(async (fileName) => {
        try {
          const filePath = path.join(LOOPS_DIR, fileName);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data: frontmatter, content } = matter(fileContent);

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
            program: frontmatter.program,
            status: frontmatter.status || 'unknown',
            score: frontmatter.score || 0.0,
            tags: frontmatter.tags || [],
            created: frontmatter.created || new Date().toISOString().split('T')[0],
            uuid: frontmatter.uuid || loopId,
            summary: frontmatter.summary || summary,
            filePath: `runtime/loops/${fileName}`,
            type: frontmatter.type || 'task',
            origin: frontmatter.origin || 'file',
          };
        } catch (error) {
          console.error(`Failed to load legacy loop ${fileName}:`, error);
          return null;
        }
      })
    );

    return loops.filter(loop => loop !== null) as LoopMetadata[];
  } catch (error) {
    console.error('Failed to load legacy loops directory:', error);
    return [];
  }
}

// --- API Handlers ---
async function handleDemoLoopsRequest(
  request: NextRequest, 
  workstreamContext: WorkstreamContext
): Promise<NextResponse> {
  const { workstream, isValid } = workstreamContext;
  
  // Validate workstream parameter format (alphanumeric only, 3-20 chars)
  const workstreamRegex = /^[a-zA-Z][a-zA-Z0-9]{2,19}$/;
  
  // Require explicit and valid workstream context
  if (!isValid || !workstream || !workstreamRegex.test(workstream)) {
    await logWorkstreamOperation({
      workstream: workstream || 'unknown',
      operation: 'read',
      endpoint: '/api/demo-loops',
      result: 'error',
      error: 'Missing or invalid workstream parameter'
    });
    
    return createWorkstreamErrorResponse(
      'Missing or invalid workstream parameter. Must be alphanumeric, 3-20 characters.',
      workstreamContext,
      400
    );
  }
  
  // Check permissions
  if (!hasWorkstreamPermission(workstream, 'read')) {
    await logWorkstreamOperation({
      workstream,
      operation: 'read',
      endpoint: '/api/demo-loops',
      result: 'error',
      error: 'Insufficient permissions'
    });
    
    return createWorkstreamErrorResponse(
      'Insufficient permissions for workstream',
      workstreamContext,
      403
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const rawLoopId = searchParams.get('id');

    if (rawLoopId) {
      // Sanitize loopId to prevent directory traversal
      const loopId = rawLoopId.replace(/[^a-zA-Z0-9\-_.]/g, '');
      
      // Additional validation for loop ID format
      if (loopId !== rawLoopId || loopId.includes('..') || loopId.includes('/')) {
        await logWorkstreamOperation({
          workstream,
          operation: 'read',
          endpoint: '/api/demo-loops',
          data: { invalidLoopId: rawLoopId },
          result: 'error',
          error: 'Invalid loop ID format'
        });
        
        return createWorkstreamErrorResponse(
          'Invalid loop ID format. Only alphanumeric characters, hyphens, underscores, and dots allowed.',
          workstreamContext,
          400
        );
      }
      
      // Load specific loop
      const fileName = loopId.endsWith('.md') ? loopId : `${loopId}.md`;
      const loop = await loadWorkstreamLoopMetadata(workstream, `artefacts/${fileName}`)
        .catch(() => loadWorkstreamLoopMetadata(workstream, fileName));
      
      if (!loop) {
        await logWorkstreamOperation({
          workstream,
          operation: 'read',
          endpoint: '/api/demo-loops',
          data: { loopId },
          result: 'error',
          error: 'Loop not found'
        });
        
        return createWorkstreamErrorResponse(
          `Loop not found: ${loopId}`,
          workstreamContext,
          404
        );
      }

      await logWorkstreamOperation({
        workstream,
        operation: 'read',
        endpoint: '/api/demo-loops',
        data: { loopId },
        result: 'success'
      });

      return createWorkstreamResponse(loop, workstreamContext);
    } else {
      // Load all loops for the workstream
      const workstreamLoops = await loadAllWorkstreamLoops(workstream);
      
      // For backwards compatibility, include legacy loops for all workstreams if they exist
      const legacyLoops = await loadLegacyLoops();
      const allLoops = [...workstreamLoops, ...legacyLoops];

      // Apply strict workstream filtering to ensure data isolation
      const filteredLoops = allLoops.filter(loop => 
        loop.workstream.toLowerCase() === workstream.toLowerCase()
      );

      await logWorkstreamOperation({
        workstream,
        operation: 'read',
        endpoint: '/api/demo-loops',
        data: { count: filteredLoops.length },
        result: 'success'
      });

      return createWorkstreamResponse({ artefacts: filteredLoops }, workstreamContext);
    }
  } catch (error) {
    console.error(`Error in demo-loops API for workstream ${workstream}:`, error);
    
    await logWorkstreamOperation({
      workstream,
      operation: 'read',
      endpoint: '/api/demo-loops',
      result: 'error',
      error: String(error)
    });

    return createWorkstreamErrorResponse(
      'Internal server error',
      workstreamContext,
      500
    );
  }
}

export const GET = withWorkstreamContext(handleDemoLoopsRequest); 