"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter, useSearchParams } from 'next/navigation';
import { EnrichedPhase, EnrichedLoop } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select'; // Assuming this component exists
import { validateLoopSchema, formatValidationError } from '@/lib/schema-validation';
import { AlertTriangle } from "lucide-react";

// --- Component ---
export default function PhaseDocView() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [phases, setPhases] = useState<EnrichedPhase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loopValidations, setLoopValidations] = useState<Record<string, any>>({});

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('created_desc');

    const activePhase = useMemo(() => {
        const phaseParam = searchParams.get('phase');
        if (!phaseParam) return phases.find(p => p.status === 'in_progress');
        return phases.find(p => p.phase === parseFloat(phaseParam));
    }, [phases, searchParams]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        activePhase?.loops.forEach(loop => {
            loop.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [activePhase]);

    const filteredAndSortedLoops = useMemo(() => {
        if (!activePhase) return [];
        let loops = activePhase.loops;

        if (statusFilter !== 'all') {
            loops = loops.filter(loop => loop.status === statusFilter);
        }
        if (tagFilter.length > 0) {
            loops = loops.filter(loop => tagFilter.every(tag => loop.tags.includes(tag)));
        }
        loops.sort((a, b) => {
            if (sortBy === 'score_desc') return b.score - a.score;
            if (sortBy === 'score_asc') return a.score - b.score;
            return new Date(b.created).getTime() - new Date(a.created).getTime();
        });
        return loops;
    }, [activePhase, statusFilter, tagFilter, sortBy]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/roadmap');
                if (!response.ok) throw new Error('Failed to fetch roadmap data');
                const result = await response.json();
                setPhases(result);

                // Validate loop content for display
                const validations: Record<string, any> = {};
                result.forEach((phase: EnrichedPhase) => {
                    phase.loops.forEach((loop: EnrichedLoop) => {
                        if (loop.content) {
                            const validation = validateLoopSchema(loop.content, loop.id);
                            validations[loop.id] = validation;
                            if (!validation.isValid) {
                                console.error(`Loop schema validation failed for ${loop.id}:`, validation.errors);
                            }
                        }
                    });
                });
                setLoopValidations(validations);

                if (!searchParams.get('phase')) {
                    const inProgressPhase = result.find((p: EnrichedPhase) => p.status === 'in_progress');
                    if (inProgressPhase) router.replace(`/phase-doc?phase=${inProgressPhase.phase}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [searchParams, router]);

    const handlePhaseChange = (phaseValue: string) => {
        router.push(`/phase-doc?phase=${phaseValue}`);
    };
    
    if (isLoading) return <div className="container mx-auto p-4">Loading phase document...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
    if (!activePhase) return <div className="container mx-auto p-4">Phase not found or none are in progress.</div>

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-4">
                <h1 className="text-4xl font-bold mb-2">{activePhase.title}</h1>
                <div className="flex items-center space-x-4">
                    <Badge>{activePhase.status}</Badge>
                    <span className="text-lg text-gray-600">Phase {activePhase.phase}</span>
                </div>
            </header>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-slate-50">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                    <Select value={String(activePhase.phase)} onValueChange={handlePhaseChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {phases.map(p => <SelectItem key={p.id} value={String(p.phase)}>Phase {p.phase}: {p.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <MultiSelect
                        options={allTags.map(tag => ({ value: tag, label: tag }))}
                        selected={tagFilter}
                        onChange={setTagFilter}
                        placeholder="Filter by tags..."
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_desc">Newest First</SelectItem>
                            <SelectItem value="score_desc">Score (High to Low)</SelectItem>
                            <SelectItem value="score_asc">Score (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <main className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold mb-4">Phase Documentation</h2>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activePhase.content }} />
                </section>
                <section>
                    <h2 className="text-3xl font-bold mb-6 border-b pb-2">Loops in this Phase</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {filteredAndSortedLoops.map(loop => {
                            const validation = loopValidations[loop.id];
                            const isValid = validation ? validation.isValid : true;
                            
                            return (
                                <AccordionItem key={loop.id} value={loop.id}>
                                    <AccordionTrigger>
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-lg">{loop.title}</span>
                                                {!isValid && (
                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Incomplete
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span>ID: {loop.id}</span>
                                                <Badge variant={loop.status === 'complete' ? 'default' : 'secondary'}>{loop.status}</Badge>
                                                <span>Score: {loop.score}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {!isValid && validation && (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle>Structurally Invalid Loop File</AlertTitle>
                                                <AlertDescription>
                                                    {formatValidationError(validation, 'Loop file')}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: loop.content }} />
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                        {filteredAndSortedLoops.length === 0 && (
                            <div className="p-4">
                                {activePhase?.loops.length === 0 ? (
                                    <p className="text-muted-foreground">No loops found for this phase.</p>
                                ) : (
                                    <p className="text-muted-foreground">No valid loops found matching the current filters.</p>
                                )}
                            </div>
                        )}
                    </Accordion>
                </section>
            </main>
        </div>
    );
} 