"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, RefreshCw, Download, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';

interface AuditLogEntry {
  workstream: string;
  operation: string;
  endpoint: string;
  data?: any;
  result: 'success' | 'error';
  error?: string;
  timestamp: string;
  user?: string;
}

interface AuditLogResponse {
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

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Filter states
  const [workstreamFilter, setWorkstreamFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Available filter options
  const [availableWorkstreams, setAvailableWorkstreams] = useState<string[]>([]);
  const [availableOperations, setAvailableOperations] = useState<string[]>([]);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const limit = 50;

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });

      if (workstreamFilter && workstreamFilter !== 'all') params.append('workstream', workstreamFilter);
      if (operationFilter && operationFilter !== 'all') params.append('operation', operationFilter);
      if (resultFilter && resultFilter !== 'all') params.append('result', resultFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'x-workstream': 'ora' // Default workstream for admin access
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const data: AuditLogResponse = await response.json();
      
      setLogs(data.logs);
      setTotalCount(data.totalCount);
      setFilteredCount(data.filteredCount);
      setAvailableWorkstreams(data.workstreams);
      setAvailableOperations(data.operations);

    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, workstreamFilter, operationFilter, resultFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setWorkstreamFilter('all');
    setOperationFilter('all');
    setResultFilter('all');
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const getStatusIcon = (result: string, operation: string) => {
    if (result === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (result === 'error') {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-green-100 text-green-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'chat': return 'bg-purple-100 text-purple-800';
      case 'mutate': return 'bg-orange-100 text-orange-800';
      case 'agentic_action': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      log.endpoint.toLowerCase().includes(searchLower) ||
      log.operation.toLowerCase().includes(searchLower) ||
      log.workstream.toLowerCase().includes(searchLower) ||
      (log.error && log.error.toLowerCase().includes(searchLower))
    );
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Workstream', 'Operation', 'Endpoint', 'Result', 'Error', 'Data'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.workstream,
        log.operation,
        log.endpoint,
        log.result,
        log.error || '',
        JSON.stringify(log.data || {})
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Audit Log Viewer
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Comprehensive audit trail of all system operations and user actions
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filters & Search
          </div>
          
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select value={workstreamFilter} onValueChange={setWorkstreamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Workstream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workstreams</SelectItem>
                {availableWorkstreams.map(ws => (
                  <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                {availableOperations.map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAuditLogs}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {filteredCount} logs 
              {totalCount !== filteredCount && ` (${totalCount} total)`}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Loading audit logs...</div>
          </div>
        )}

        {/* Logs Table */}
        {!loading && (
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <Card key={index} className="border-l-4 border-l-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.result, log.operation)}
                        <Badge className={getOperationColor(log.operation)}>
                          {log.operation.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          {log.endpoint}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.workstream}
                        </Badge>
                      </div>

                      {/* Error Message */}
                      {log.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {log.error}
                        </div>
                      )}

                      {/* Data Preview */}
                      {log.data && Object.keys(log.data).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Data ({Object.keys(log.data).length} fields)
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground text-right">
                      {formatTimestamp(log.timestamp)}
                      {log.user && (
                        <div className="mt-1">
                          User: {log.user}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* No Results */}
            {filteredLogs.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>No audit logs found matching your criteria</div>
                <div className="text-sm mt-1">Try adjusting your filters or search terms</div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredCount > limit && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(filteredCount / limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(filteredCount / limit) - 1 || loading}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 