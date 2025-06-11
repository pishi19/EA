"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, Download, Trash2, Edit, Archive, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ArtefactInfo {
    id: string;
    title: string;
    phase: string;
    workstream: string;
    status: string;
    score: number;
    tags: string[];
    created: string;
    filePath: string;
    type: string;
}

interface BulkOperationResult {
    success: number;
    failed: number;
    errors: string[];
}

export default function ArtefactBulkOperations() {
    // Default to 'ora' workstream for admin interface
    const [currentWorkstream, setCurrentWorkstream] = useState('ora');
    const [artefacts, setArtefacts] = useState<ArtefactInfo[]>([]);
    const [selectedArtefacts, setSelectedArtefacts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPhase, setFilterPhase] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isOperationLoading, setIsOperationLoading] = useState(false);
    const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);

    // Available phases and statuses for filtering
    const [availablePhases, setAvailablePhases] = useState<string[]>([]);
    const [availableStatuses] = useState(['planning', 'in_progress', 'complete', 'blocked']);
    const [availableWorkstreams] = useState(['ora', 'mecca', 'sales']);

    useEffect(() => {
        fetchArtefacts();
    }, [currentWorkstream]);

    const fetchArtefacts = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching artefacts for workstream:', currentWorkstream);
            
            const response = await fetch(`/api/demo-loops?workstream=${currentWorkstream}`);
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Artefacts data:', data);
                
                const artefactList = data.artefacts || [];
                setArtefacts(artefactList);
                
                // Extract unique phases for filtering
                const phaseSet = new Set<string>();
                artefactList.forEach((a: ArtefactInfo) => {
                    if (a.phase && typeof a.phase === 'string') {
                        phaseSet.add(a.phase);
                    }
                });
                const phases = Array.from(phaseSet).sort();
                setAvailablePhases(phases);
                
                console.log(`Loaded ${artefactList.length} artefacts, ${phases.length} phases`);
            } else {
                const errorText = await response.text();
                setError(`Failed to fetch artefacts: ${response.status} ${errorText}`);
            }
        } catch (err) {
            console.error('Error in fetchArtefacts:', err);
            setError('Error loading artefacts: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Filter artefacts based on search and filters
    const filteredArtefacts = artefacts.filter(artefact => {
        const matchesSearch = artefact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             artefact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPhase = filterPhase === 'all' || artefact.phase === filterPhase;
        const matchesStatus = filterStatus === 'all' || artefact.status === filterStatus;
        
        return matchesSearch && matchesPhase && matchesStatus;
    });

    const handleSelectAll = () => {
        if (selectedArtefacts.size === filteredArtefacts.length) {
            setSelectedArtefacts(new Set());
        } else {
            setSelectedArtefacts(new Set(filteredArtefacts.map(a => a.id)));
        }
    };

    const handleSelectArtefact = (artefactId: string, checked: boolean) => {
        const newSelected = new Set(selectedArtefacts);
        if (checked) {
            newSelected.add(artefactId);
        } else {
            newSelected.delete(artefactId);
        }
        setSelectedArtefacts(newSelected);
    };

    const getSelectedArtefacts = () => {
        return artefacts.filter(a => selectedArtefacts.has(a.id));
    };

    const performBulkOperation = async (operation: 'delete' | 'archive' | 'update_status', params?: any) => {
        const selected = getSelectedArtefacts();
        if (selected.length === 0) {
            setError('No artefacts selected');
            return;
        }

        const operationName = operation === 'update_status' ? `update status to ${params.status}` : operation;
        const confirmMessage = `Are you sure you want to ${operationName} ${selected.length} artefact(s)?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        setIsOperationLoading(true);
        setOperationResult(null);
        setError('');

        const results: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        try {
            for (const artefact of selected) {
                try {
                    let response;
                    
                    switch (operation) {
                        case 'delete':
                            response = await fetch('/api/task-mutations', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'delete',
                                    taskId: artefact.id,
                                    workstream: currentWorkstream
                                })
                            });
                            break;
                            
                        case 'update_status':
                            response = await fetch('/api/task-mutations', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'edit',
                                    taskId: artefact.id,
                                    taskData: {
                                        ...artefact,
                                        status: params.status
                                    },
                                    workstream: currentWorkstream
                                })
                            });
                            break;
                            
                        case 'archive':
                            response = await fetch('/api/task-mutations', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'edit',
                                    taskId: artefact.id,
                                    taskData: {
                                        ...artefact,
                                        status: 'archived'
                                    },
                                    workstream: currentWorkstream
                                })
                            });
                            break;
                    }

                    if (response?.ok) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to ${operation} ${artefact.title}`);
                    }
                } catch (err) {
                    results.failed++;
                    results.errors.push(`Error processing ${artefact.title}: ${err}`);
                }
            }

            setOperationResult(results);
            await fetchArtefacts();
            setSelectedArtefacts(new Set());
            
        } catch (err) {
            setError('Bulk operation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsOperationLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'blocked':
                return 'bg-red-100 text-red-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    console.log('Component render - Loading:', loading, 'Artefacts:', artefacts.length, 'Error:', error);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Artefact Bulk Operations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-2" />
                        Loading artefacts from {currentWorkstream} workstream...
                    </div>
                    <div className="text-xs text-muted-foreground text-center mt-2">
                        Debug: Fetching from /api/demo-loops?workstream={currentWorkstream}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Artefact Bulk Operations</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage multiple artefacts simultaneously ({artefacts.length} artefacts loaded)
                        </p>
                    </div>
                    <Select value={currentWorkstream} onValueChange={setCurrentWorkstream}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableWorkstreams.map(ws => (
                                <SelectItem key={ws} value={ws}>
                                    {ws.charAt(0).toUpperCase() + ws.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {operationResult && (
                    <Alert className="mb-4 border-blue-200 bg-blue-50">
                        <AlertDescription className="text-blue-800">
                            Operation completed: {operationResult.success} successful, {operationResult.failed} failed
                            {operationResult.errors.length > 0 && (
                                <div className="mt-2 text-sm">
                                    Errors: {operationResult.errors.slice(0, 3).join(', ')}
                                    {operationResult.errors.length > 3 && ` (+${operationResult.errors.length - 3} more)`}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search artefacts by title or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={filterPhase} onValueChange={setFilterPhase}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by phase" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Phases</SelectItem>
                            {availablePhases.map(phase => (
                                <SelectItem key={phase} value={phase}>Phase {phase}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {availableStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchArtefacts}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Selection Controls */}
                {filteredArtefacts.length > 0 && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleSelectAll}
                                className="flex items-center gap-2"
                            >
                                {selectedArtefacts.size === filteredArtefacts.length ? 
                                    <CheckSquare className="w-4 h-4" /> : 
                                    <Square className="w-4 h-4" />
                                }
                                {selectedArtefacts.size === filteredArtefacts.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {selectedArtefacts.size} of {filteredArtefacts.length} selected
                            </span>
                        </div>
                        
                        {selectedArtefacts.size > 0 && (
                            <div className="flex items-center gap-2">
                                <Select onValueChange={(status) => performBulkOperation('update_status', { status })}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Set Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="complete">Complete</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => performBulkOperation('archive')}
                                    disabled={isOperationLoading}
                                >
                                    <Archive className="w-4 h-4 mr-1" />
                                    Archive
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => performBulkOperation('delete')}
                                    disabled={isOperationLoading}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Artefacts List */}
                <div className="space-y-2">
                    {filteredArtefacts.length > 0 ? (
                        filteredArtefacts.map((artefact) => (
                            <Card key={artefact.id} className="border border-gray-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Checkbox
                                            checked={selectedArtefacts.has(artefact.id)}
                                            onCheckedChange={(checked) => 
                                                handleSelectArtefact(artefact.id, checked as boolean)
                                            }
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-medium">{artefact.title}</h3>
                                                <Badge className={getStatusColor(artefact.status)}>
                                                    {artefact.status}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Phase {artefact.phase}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Score: {artefact.score}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Created: {artefact.created}</span>
                                                <span>Type: {artefact.type}</span>
                                                <span>ID: {artefact.id}</span>
                                                {artefact.tags.length > 0 && (
                                                    <span>Tags: {artefact.tags.slice(0, 3).join(', ')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground">
                                {searchTerm || filterPhase !== 'all' || filterStatus !== 'all' ? 
                                    'No artefacts match your filters.' : 
                                    'No artefacts found in this workstream.'
                                }
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={fetchArtefacts} 
                                className="mt-4"
                            >
                                Retry Loading
                            </Button>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Bulk Operations Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="font-medium text-blue-800">Total Artefacts</div>
                            <div className="text-blue-600">{artefacts.length}</div>
                        </div>
                        <div>
                            <div className="font-medium text-blue-800">Filtered</div>
                            <div className="text-blue-600">{filteredArtefacts.length}</div>
                        </div>
                        <div>
                            <div className="font-medium text-blue-800">Selected</div>
                            <div className="text-blue-600">{selectedArtefacts.size}</div>
                        </div>
                        <div>
                            <div className="font-medium text-blue-800">Workstream</div>
                            <div className="text-blue-600 capitalize">{currentWorkstream}</div>
                        </div>
                    </div>
                </div>


            </CardContent>
        </Card>
    );
} 