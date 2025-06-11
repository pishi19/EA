import { NextRequest, NextResponse } from "next/server";
import { withWorkstreamContext, logWorkstreamOperation } from '@/lib/workstream-api';
import path from 'path';
import fs from 'fs';

export interface AuditLogEntry {
  workstream: string;
  operation: string;
  endpoint: string;
  data?: any;
  result: 'success' | 'error';
  error?: string;
  timestamp: string;
  user?: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  totalCount: number;
  filteredCount: number;
  workstreams: string[];
  operations: string[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

async function getAuditLogs(
  workstream?: string,
  operation?: string,
  result?: string,
  dateFrom?: string,
  dateTo?: string,
  limit: number = 100,
  offset: number = 0
): Promise<AuditLogResponse> {
  try {
    // Get project root
    const projectRoot = process.cwd().includes('react-app') 
      ? path.resolve(process.cwd(), '../../..')
      : process.cwd();

    const allLogs: AuditLogEntry[] = [];
    const workstreams = new Set<string>();
    const operations = new Set<string>();

    // Read all audit log files across workstreams
    const workstreamDirs = ['ora', 'mecca', 'sales'];
    
    for (const ws of workstreamDirs) {
      const logsDir = path.join(projectRoot, 'runtime', 'workstreams', ws, 'logs');
      
      if (!fs.existsSync(logsDir)) continue;
      
      const files = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('audit-') && file.endsWith('.json'))
        .sort(); // Sort to get chronological order

      for (const file of files) {
        try {
          const filePath = path.join(logsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const logs: AuditLogEntry[] = JSON.parse(fileContent);
          
          logs.forEach(log => {
            workstreams.add(log.workstream);
            operations.add(log.operation);
          });
          
          allLogs.push(...logs);
        } catch (error) {
          console.error(`Error reading audit log file ${file}:`, error);
        }
      }
    }

    // Sort logs by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filteredLogs = allLogs;

    if (workstream) {
      filteredLogs = filteredLogs.filter(log => log.workstream === workstream);
    }

    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
    }

    if (result) {
      filteredLogs = filteredLogs.filter(log => log.result === result);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    // Calculate date range
    const dates = allLogs.map(log => log.timestamp).sort();
    const dateRange = {
      earliest: dates[0] || new Date().toISOString(),
      latest: dates[dates.length - 1] || new Date().toISOString()
    };

    return {
      logs: paginatedLogs,
      totalCount: allLogs.length,
      filteredCount: filteredLogs.length,
      workstreams: Array.from(workstreams).sort(),
      operations: Array.from(operations).sort(),
      dateRange
    };

  } catch (error) {
    console.error('Error reading audit logs:', error);
    throw error;
  }
}

export const GET = withWorkstreamContext(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  
  const workstream = searchParams.get('workstream') || undefined;
  const operation = searchParams.get('operation') || undefined;
  const result = searchParams.get('result') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const auditData = await getAuditLogs(
      workstream,
      operation,
      result,
      dateFrom,
      dateTo,
      limit,
      offset
    );

    // Log this audit log access
    await logWorkstreamOperation({
      workstream: context.workstream,
      operation: 'read',
      endpoint: '/api/audit-logs',
      data: {
        filters: { workstream, operation, result, dateFrom, dateTo },
        resultCount: auditData.filteredCount
      },
      result: 'success'
    });

    return NextResponse.json(auditData);

  } catch (error) {
    console.error('Audit logs API error:', error);
    
    await logWorkstreamOperation({
      workstream: context.workstream,
      operation: 'read',
      endpoint: '/api/audit-logs',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Re-throw to let the middleware handle the error response
    throw error;
  }
});
