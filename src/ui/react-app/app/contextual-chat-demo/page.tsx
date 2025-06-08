"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileText, Cog, BookOpen } from "lucide-react";

// --- Types ---
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

// Helper function to get type badge based on tags
const getTypeBadge = (tags: string[]) => {
    if (tags.some(tag => tag.includes('planning') || tag.includes('strategic'))) {
        return { icon: <FileText className="h-3 w-3" />, label: 'Planning', color: 'bg-blue-100 text-blue-800' };
    }
    if (tags.some(tag => tag.includes('retrospective') || tag.includes('review'))) {
        return { icon: <BookOpen className="h-3 w-3" />, label: 'Retrospective', color: 'bg-amber-100 text-amber-800' };
    }
    return { icon: <Cog className="h-3 w-3" />, label: 'Execution', color: 'bg-green-100 text-green-800' };
};

// --- Component ---
export default function ContextualChatDemo() {
    const [availableLoops, setAvailableLoops] = useState<LoopMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter states
    const [workstreamFilter, setWorkstreamFilter] = useState<string>('all');
    const [programFilter, setProgramFilter] = useState<string>('all'); // Phase-based
    const [projectFilter, setProjectFilter] = useState<string>('all'); // Tag-based
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('created_desc');

    // Computed filter options
    const allWorkstreams = useMemo(() => {
        const workstreams = new Set<string>();
        availableLoops.forEach(loop => {
            if (loop.workstream && loop.workstream !== 'unknown') {
                workstreams.add(loop.workstream);
            }
        });
        return ['all', ...Array.from(workstreams).sort()];
    }, [availableLoops]);

    const allPrograms = useMemo(() => {
        const programs = new Set<string>();
        availableLoops.forEach(loop => {
            if (loop.phase && loop.phase !== '0.0') {
                programs.add(`Phase ${loop.phase}`);
            }
        });
        return ['all', ...Array.from(programs).sort()];
    }, [availableLoops]);

    const allProjects = useMemo(() => {
        const projects = new Set<string>();
        availableLoops.forEach(loop => {
            if (loop.tags && loop.tags.length > 0) {
                loop.tags.forEach(tag => {
                    if (tag && tag.trim() && !tag.startsWith('#')) {
                        projects.add(tag);
                    }
                });
            }
        });
        return ['all', ...Array.from(projects).sort()];
    }, [availableLoops]);

    // Filtered and sorted loops
    const filteredLoops = useMemo(() => {
        let filtered = availableLoops;

        // Apply filters
        if (workstreamFilter !== 'all') {
            filtered = filtered.filter(loop => loop.workstream === workstreamFilter);
        }
        
        if (programFilter !== 'all') {
            const phaseNum = programFilter.replace('Phase ', '');
            filtered = filtered.filter(loop => loop.phase === phaseNum);
        }
        
        if (projectFilter !== 'all') {
            filtered = filtered.filter(loop => loop.tags && loop.tags.includes(projectFilter));
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(loop => loop.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score_desc':
                    return b.score - a.score;
                case 'score_asc':
                    return a.score - b.score;
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'workstream_asc':
                    return a.workstream.localeCompare(b.workstream);
                case 'created_desc':
                default:
                    return new Date(b.created).getTime() - new Date(a.created).getTime();
            }
        });

        return filtered;
    }, [availableLoops, workstreamFilter, programFilter, projectFilter, statusFilter, sortBy]);

    // Load loops from API
    const loadAvailableLoops = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/demo-loops');
            
            if (!response.ok) {
                throw new Error(`Failed to load loops: ${response.status}`);
            }
            
            const loops = await response.json();
            setAvailableLoops(loops);
            
        } catch (err) {
            console.error('Error loading loops:', err);
            setError(err instanceof Error ? err.message : 'Failed to load loops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAvailableLoops();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Semantic Chat Demo</h1>
                    <p className="text-muted-foreground">Loading contextual artefacts...</p>
                    <Button onClick={loadAvailableLoops} className="mt-4">Retry Loading</Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Semantic Chat Demo</h1>
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <Button onClick={loadAvailableLoops}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Semantic Chat Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Enhanced Artefact Filtering & Contextual Chat Architecture
                </p>
                <div className="flex justify-center space-x-6 text-sm">
                    <span>Total: <strong>{availableLoops.length}</strong> artefacts</span>
                    <span>Filtered: <strong>{filteredLoops.length}</strong> shown</span>
                    <span>Workstreams: <strong>{allWorkstreams.length - 1}</strong></span>
                    <span>Programs: <strong>{allPrograms.length - 1}</strong></span>
                </div>
            </div>

            {/* Enhanced Filtering Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>🔍 Artefact Filtering Controls</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Workstream</label>
                            <Select value={workstreamFilter} onValueChange={setWorkstreamFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allWorkstreams.map(ws => (
                                        <SelectItem key={ws} value={ws}>
                                            {ws === 'all' ? 'All Workstreams' : ws}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program (Phase)</label>
                            <Select value={programFilter} onValueChange={setProgramFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allPrograms.map(program => (
                                        <SelectItem key={program} value={program}>
                                            {program === 'all' ? 'All Programs' : program}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project (Tags)</label>
                            <Select value={projectFilter} onValueChange={setProjectFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allProjects.map(project => (
                                        <SelectItem key={project} value={project}>
                                            {project === 'all' ? 'All Projects' : project}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="complete">Complete</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
                                    <SelectItem value="planning">Planning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_desc">Newest First</SelectItem>
                                    <SelectItem value="score_desc">Score (High→Low)</SelectItem>
                                    <SelectItem value="score_asc">Score (Low→High)</SelectItem>
                                    <SelectItem value="title_asc">Title (A→Z)</SelectItem>
                                    <SelectItem value="workstream_asc">Workstream (A→Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setWorkstreamFilter('all');
                                    setProgramFilter('all');
                                    setProjectFilter('all');
                                    setStatusFilter('all');
                                    setSortBy('created_desc');
                                }}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filtered Results */}
            <Card>
                <CardHeader>
                    <CardTitle>📋 Filtered Artefacts ({filteredLoops.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredLoops.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No artefacts match the current filters.</p>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setWorkstreamFilter('all');
                                    setProgramFilter('all');
                                    setProjectFilter('all');
                                    setStatusFilter('all');
                                }} 
                                className="mt-4"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredLoops.map((loop) => {
                                const typeBadge = getTypeBadge(loop.tags || []);
                                
                                return (
                                    <div key={loop.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold text-sm leading-tight">{loop.title}</h3>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={`flex items-center gap-1 text-xs ${typeBadge.color}`}
                                                >
                                                    {typeBadge.icon}
                                                    {typeBadge.label}
                                                </Badge>
                                            </div>
                                            
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div>Phase: <strong>{loop.phase}</strong> | Workstream: <strong>{loop.workstream}</strong></div>
                                                <div>Status: <Badge variant={loop.status === 'complete' ? 'default' : 'secondary'} className="text-xs">{loop.status}</Badge> | Score: <strong>{loop.score}</strong></div>
                                            </div>
                                            
                                            {loop.tags && loop.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {loop.tags.slice(0, 3).map((tag, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {loop.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{loop.tags.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="text-xs text-gray-400 truncate">
                                                {loop.summary}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Implementation Status */}
            <Card>
                <CardHeader>
                    <CardTitle>🎉 Enhanced Semantic Chat Demo Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-medium text-green-700">✅ Successfully Implemented</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• <strong>Workstream Filtering:</strong> {allWorkstreams.length - 1} workstreams available</li>
                                <li>• <strong>Program Filtering:</strong> {allPrograms.length - 1} phases/programs available</li>
                                <li>• <strong>Project Filtering:</strong> {allProjects.length - 1} tag-based projects available</li>
                                <li>• <strong>Status & Sorting:</strong> Complete filtering and sorting controls</li>
                                <li>• <strong>Real-time Updates:</strong> Dynamic filter combinations</li>
                                <li>• <strong>Clear Filters:</strong> Reset functionality for easy navigation</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-700">🔄 Ready for Enhancement</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                                <li>• Chat integration with filtered context</li>
                                <li>• Loop content preview and editing</li>
                                <li>• Advanced search functionality</li>
                                <li>• Export/sharing filtered results</li>
                                <li>• Real-time collaboration features</li>
                                <li>• Semantic similarity grouping</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-6 text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800 font-medium">
                            🚀 Comprehensive artefact filtering now fully operational with {filteredLoops.length}/{availableLoops.length} artefacts displayed!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 