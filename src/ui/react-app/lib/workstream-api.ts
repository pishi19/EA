/**
 * Workstream API Utilities
 * 
 * Provides middleware, validation, and helper functions for workstream-scoped API operations.
 * Ensures strict domain isolation and multi-tenant data access patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Workstream Configuration Registry
export interface WorkstreamConfig {
  name: string;
  displayName: string;
  description: string;
  status: 'active' | 'planning' | 'archived';
  dataPath: string;
  allowedOperations: string[];
  owner?: string;
  phase?: string;
}

export const WORKSTREAM_REGISTRY: Record<string, WorkstreamConfig> = {
  ora: {
    name: 'ora',
    displayName: 'Ora System',
    description: 'Context-aware autonomous agent - Core system development',
    status: 'active',
    dataPath: '/runtime/workstreams/ora',
    allowedOperations: ['read', 'write', 'delete', 'chat', 'mutate'],
    owner: 'System Team',
    phase: '11 - Filtering & Hierarchy'
  },
  mecca: {
    name: 'mecca',
    displayName: 'Mecca Project',
    description: 'Strategic business development initiative',
    status: 'planning',
    dataPath: '/runtime/workstreams/mecca',
    allowedOperations: ['read', 'write', 'chat', 'mutate'],
    owner: 'Business Team',
    phase: '1 - Foundation & Planning'
  },
  sales: {
    name: 'sales',
    displayName: 'Sales & Marketing',
    description: 'Customer acquisition and marketing operations',
    status: 'planning',
    dataPath: '/runtime/workstreams/sales',
    allowedOperations: ['read', 'write', 'chat', 'mutate'],
    owner: 'Revenue Team',
    phase: '1 - Customer Acquisition'
  }
};

// Workstream validation
export function isValidWorkstream(workstream: string): boolean {
  return workstream in WORKSTREAM_REGISTRY;
}

// Workstream context extraction from request
export interface WorkstreamContext {
  workstream: string;
  config: WorkstreamConfig;
  dataPath: string;
  isValid: boolean;
  source: 'url' | 'query' | 'body' | 'header' | 'default';
}

export async function extractWorkstreamContext(request: NextRequest): Promise<WorkstreamContext> {
  let workstream: string | undefined;
  let source: WorkstreamContext['source'] = 'default';

  // Priority 1: URL path parameter (/workstream/[name]/api/...)
  const urlPath = request.nextUrl.pathname;
  const workstreamMatch = urlPath.match(/\/workstream\/([^\/]+)/);
  if (workstreamMatch) {
    workstream = workstreamMatch[1];
    source = 'url';
  }

  // Priority 2: Query parameter (?workstream=name)
  if (!workstream) {
    workstream = request.nextUrl.searchParams.get('workstream') ?? undefined;
    if (workstream) source = 'query';
  }

  // Priority 3: Request body (for POST/PUT requests)
  if (!workstream && (request.method === 'POST' || request.method === 'PUT')) {
    try {
      const body = await request.clone().json();
      if (body.workstream) {
        workstream = body.workstream;
        source = 'body';
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  // Priority 4: Custom header
  if (!workstream) {
    workstream = request.headers.get('x-workstream') ?? undefined;
    if (workstream) source = 'header';
  }

  // Require explicit workstream - no defaults
  if (!workstream) {
    return {
      workstream: '',
      config: null as any,
      dataPath: '',
      isValid: false,
      source: 'default'
    };
  }

  // Normalize and validate
  const normalizedWorkstream = workstream.toLowerCase().trim();
  const isValid = isValidWorkstream(normalizedWorkstream);
  const config = isValid ? WORKSTREAM_REGISTRY[normalizedWorkstream] : null as any;

  return {
    workstream: normalizedWorkstream,
    config,
    dataPath: config?.dataPath || '',
    isValid,
    source
  };
}

// Workstream middleware wrapper
export function withWorkstreamContext<T = any>(
  handler: (request: NextRequest, context: WorkstreamContext) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string; message: string; timestamp: string }>> => {
    try {
      const workstreamContext = await extractWorkstreamContext(request);
      
      // Log workstream context for debugging
      console.log(`[API] ${request.method} ${request.nextUrl.pathname} - Workstream: ${workstreamContext.workstream} (${workstreamContext.source})`);
      
      return await handler(request, workstreamContext);
    } catch (error) {
      console.error('[Workstream Middleware] Error:', error);
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          message: 'Failed to process workstream context',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      ) as NextResponse<T | { error: string; message: string; timestamp: string }>;
    }
  };
}

// Path utilities for workstream-scoped file operations
export function getWorkstreamDataPath(workstream: string, ...segments: string[]): string {
  const config = WORKSTREAM_REGISTRY[workstream];
  if (!config) {
    throw new Error(`Invalid workstream: ${workstream}`);
  }
  
  // Get project root (3 levels up from current file in src/ui/react-app/lib/)
  const projectRoot = process.cwd().includes('react-app') 
    ? path.resolve(process.cwd(), '../../..')
    : process.cwd();
  
  return path.join(projectRoot, config.dataPath, ...segments);
}

export function getWorkstreamArtefactsPath(workstream: string): string {
  return getWorkstreamDataPath(workstream, 'artefacts');
}

export function getWorkstreamLogsPath(workstream: string): string {
  return getWorkstreamDataPath(workstream, 'logs');
}

export function getWorkstreamRoadmapPath(workstream: string): string {
  return getWorkstreamDataPath(workstream, 'roadmap.md');
}

// Permission checking
export function hasWorkstreamPermission(
  workstream: string, 
  operation: string, 
  user?: string
): boolean {
  const config = WORKSTREAM_REGISTRY[workstream];
  if (!config) return false;
  
  return config.allowedOperations.includes(operation);
}

// Workstream-scoped file operations
export async function readWorkstreamFile(
  workstream: string, 
  ...pathSegments: string[]
): Promise<string> {
  const filePath = getWorkstreamDataPath(workstream, ...pathSegments);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file in workstream ${workstream}: ${error}`);
  }
}

export async function writeWorkstreamFile(
  workstream: string, 
  content: string,
  ...pathSegments: string[]
): Promise<void> {
  const filePath = getWorkstreamDataPath(workstream, ...pathSegments);
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file in workstream ${workstream}: ${error}`);
  }
}

export async function listWorkstreamFiles(
  workstream: string, 
  ...pathSegments: string[]
): Promise<string[]> {
  const dirPath = getWorkstreamDataPath(workstream, ...pathSegments);
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => !file.startsWith('.'));
  } catch (error) {
    // Return empty array if directory doesn't exist
    return [];
  }
}

// API Response helpers
export function createWorkstreamResponse<T>(
  data: T, 
  workstreamContext: WorkstreamContext,
  status: number = 200
): NextResponse<T & { _meta: any }> {
  return NextResponse.json({
    ...data,
    _meta: {
      workstream: workstreamContext.workstream,
      workstreamConfig: workstreamContext.config,
      timestamp: new Date().toISOString(),
      source: workstreamContext.source
    }
  }, { status });
}

export function createWorkstreamErrorResponse(
  message: string,
  workstreamContext?: WorkstreamContext,
  status: number = 400
): NextResponse {
  return NextResponse.json({
    error: message,
    workstream: workstreamContext?.workstream,
    timestamp: new Date().toISOString()
  }, { status });
}

// Validation schemas
export interface WorkstreamApiRequest {
  workstream?: string;
  [key: string]: any;
}

export function validateWorkstreamRequest(
  data: any, 
  requiredFields: string[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate workstream if provided
  if (data.workstream && !isValidWorkstream(data.workstream)) {
    errors.push(`Invalid workstream: ${data.workstream}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Audit logging
export interface WorkstreamAuditLog {
  timestamp: string;
  workstream: string;
  operation: string;
  endpoint: string;
  user?: string;
  data?: any;
  result: 'success' | 'error';
  error?: string;
}

export async function logWorkstreamOperation(
  log: Omit<WorkstreamAuditLog, 'timestamp'>
): Promise<void> {
  const logEntry: WorkstreamAuditLog = {
    ...log,
    timestamp: new Date().toISOString()
  };
  
  try {
    const logPath = getWorkstreamLogsPath(log.workstream);
    const logFile = path.join(logPath, `audit-${new Date().toISOString().split('T')[0]}.json`);
    
    // Ensure logs directory exists
    await fs.mkdir(logPath, { recursive: true });
    
    // Append to daily log file
    let existingLogs: WorkstreamAuditLog[] = [];
    try {
      const existingContent = await fs.readFile(logFile, 'utf-8');
      existingLogs = JSON.parse(existingContent);
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    existingLogs.push(logEntry);
    await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2));
    
  } catch (error) {
    console.error('[Audit Log] Failed to log operation:', error);
  }
}

export default {
  withWorkstreamContext,
  extractWorkstreamContext,
  createWorkstreamResponse,
  createWorkstreamErrorResponse,
  validateWorkstreamRequest,
  getWorkstreamDataPath,
  getWorkstreamArtefactsPath,
  getWorkstreamRoadmapPath,
  readWorkstreamFile,
  writeWorkstreamFile,
  listWorkstreamFiles,
  logWorkstreamOperation,
  WORKSTREAM_REGISTRY,
  isValidWorkstream,
  hasWorkstreamPermission
}; 