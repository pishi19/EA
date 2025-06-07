"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { EnrichedPhase, EnrichedLoop } from '@/lib/types';
import { validateLoopSchema } from '@/lib/schema-validation';
import { AlertTriangle, FileText, Cog, BookOpen } from "lucide-react";

// Helper function to get type badge
const getTypeBadge = (type: string | undefined) => {
    switch (type) {
        case 'planning':
            return { icon: <FileText className="h-3 w-3" />, label: 'Planning', color: 'bg-blue-100 text-blue-800' };
        case 'execution':
            return { icon: <Cog className="h-3 w-3" />, label: 'Execution', color: 'bg-green-100 text-green-800' };
        case 'retrospective':
            return { icon: <BookOpen className="h-3 w-3" />, label: 'Retrospective', color: 'bg-amber-100 text-amber-800' };
        default:
            return { icon: <Cog className="h-3 w-3" />, label: 'Execution', color: 'bg-green-100 text-green-800' };
    }
};


// --- Component ---
export default function SystemView() {
    const [phases, setPhases] = useState<EnrichedPhase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [workstreamFilter, setWorkstreamFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loopValidations, setLoopValidations] = useState<Record<string, any>>({});

    const allWorkstreams = useMemo(() => {
        const workstreams = new Set<string>();
        phases.forEach(phase => {
            phase.loops.forEach(loop => {
                if (loop.workstream) {
                    workstreams.add(loop.workstream);
                }
            });
        });
        return ['all', ...Array.from(workstreams)];
    }, [phases]);

    const planningLoops = useMemo(() => {
        const loops: EnrichedLoop[] = [];
        phases.forEach(phase => {
            phase.loops.forEach(loop => {
                if (loop.type === 'planning') {
                    loops.push({ ...loop, phase: phase.phase });
                }
            });
        });
        return loops.sort((a, b) => b.phase - a.phase);
    }, [phases]);

    const filteredPhases = useMemo(() => {
        let filteredPhases = phases;
        
        if (workstreamFilter !== 'all' || typeFilter !== 'all') {
            filteredPhases = phases.map(phase => ({
                ...phase,
                loops: phase.loops.filter(loop => {
                    const matchesWorkstream = workstreamFilter === 'all' || loop.workstream === workstreamFilter;
                    const matchesType = typeFilter === 'all' || loop.type === typeFilter;
                    return matchesWorkstream && matchesType;
                }),
            })).filter(phase => phase.loops.length > 0);
        }
        
        return filteredPhases;
    }, [phases, workstreamFilter, typeFilter]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/roadmap');
                if (!response.ok) {
                    throw new Error('Failed to fetch roadmap data');
                }
                const result = await response.json();
                setPhases(result);

                // Validate loop content for display indicators
                const validations: Record<string, any> = {};
                result.forEach((phase: EnrichedPhase) => {
                    phase.loops.forEach((loop: EnrichedLoop) => {
                        if (loop.content) {
                            const validation = validateLoopSchema(loop.content, loop.id);
                            validations[loop.id] = validation;
                            if (!validation.isValid) {
                                console.warn(`System View: Loop ${loop.id} has structural issues:`, validation.missingRequiredSections);
                            }
                        }
                    });
                });
                setLoopValidations(validations);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);


    if (isLoading) {
        return <div className="text-center py-8">Loading system state...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
    }
    
    return (
        <div className="container mx-auto p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">System Roadmap</CardTitle>
                    <CardDescription>An overview of all development phases and their status.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Workstream</label>
                            <Select value={workstreamFilter} onValueChange={setWorkstreamFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allWorkstreams.map(ws => <SelectItem key={ws} value={ws}>{ws === 'all' ? 'All Workstreams' : ws}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="planning">📘 Planning</SelectItem>
                                    <SelectItem value="execution">⚙️ Execution</SelectItem>
                                    <SelectItem value="retrospective">📓 Retrospective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Planning Loops Sidebar */}
                {planningLoops.length > 0 && (
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    📘 Planning Loops
                                </CardTitle>
                                <CardDescription>Strategic and planning documents</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {planningLoops.map((loop) => {
                                    const validation = loopValidations[loop.id];
                                    const isValid = validation ? validation.isValid : true;
                                    
                                    return (
                                        <div key={loop.id} className="p-3 border rounded-md bg-blue-50">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{loop.title}</p>
                                                {!isValid && (
                                                    <div title="Incomplete structure">
                                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Phase {loop.phase}</p>
                                            <div className="mt-2 flex items-center space-x-2">
                                                <Badge variant={loop.status === 'complete' ? 'default' : 'secondary'}>{loop.status}</Badge>
                                                <Badge variant="outline">Score: {loop.score}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{loop.id}</p>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content */}
                <div className={`space-y-8 ${planningLoops.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                {filteredPhases.map(phase => (
                    <Card key={phase.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">Phase {phase.phase}: {phase.title}</CardTitle>
                                    <CardDescription>Status: <Badge>{phase.status}</Badge> | Score: <Badge variant="secondary">{phase.score}</Badge></CardDescription>
                                </div>
                                <Link href={`/phase-doc?phase=${phase.phase}`}>
                                    <Button variant="outline" size="sm">View Details</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-semibold mb-2">Associated Loops:</h4>
                            {phase.loops && phase.loops.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {phase.loops.map((loop: EnrichedLoop) => {
                                        const validation = loopValidations[loop.id];
                                        const isValid = validation ? validation.isValid : true;
                                        
                                        const typeBadge = getTypeBadge(loop.type);
                                        
                                        return (
                                            <div key={loop.id} className="p-3 border rounded-md bg-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm">{loop.title}</p>
                                                    {!isValid && (
                                                        <div title="⚠️ Incomplete loop file">
                                                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{loop.id}</p>
                                                <div className="mt-2 flex items-center space-x-2 flex-wrap gap-1">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`flex items-center gap-1 ${typeBadge.color}`}
                                                    >
                                                        {typeBadge.icon}
                                                        {typeBadge.label}
                                                    </Badge>
                                                    <Badge variant={loop.status === 'complete' ? 'default' : 'secondary'}>{loop.status}</Badge>
                                                    <Badge variant="outline">Score: {loop.score}</Badge>
                                                    {!isValid && (
                                                        <Badge variant="secondary" className="text-amber-700 bg-amber-100">
                                                            Incomplete structure
                                                        </Badge>
                                                    )}
                                                </div>
                                                {/* Tags display */}
                                                {loop.tags && loop.tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {loop.tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No loops match the current filter.</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                </div>
            </div>
        </div>
    );
} 