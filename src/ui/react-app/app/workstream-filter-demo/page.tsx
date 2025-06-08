'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, X } from 'lucide-react';

interface LoopData {
  uuid: string;
  title: string;
  phase: string | number;
  workstream: string;
  status: string;
  score: number;
  tags: string[];
  created: string;
  origin: string;
  summary?: string;
  filepath: string;
}

export default function WorkstreamFilterDemo() {
  const [loops, setLoops] = useState<LoopData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedWorkstream, setSelectedWorkstream] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function fetchLoops() {
      try {
        const response = await fetch('/api/roadmap');
        const data = await response.json();
        setLoops(data.loops || []);
      } catch (error) {
        console.error('Error fetching loops:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLoops();
  }, []);

  // Compute available filter options
  const workstreams = useMemo(() => {
    const uniqueWorkstreams = new Set(loops.map(loop => loop.workstream).filter(Boolean));
    return Array.from(uniqueWorkstreams).sort();
  }, [loops]);

  const programs = useMemo(() => {
    const filteredLoops = selectedWorkstream === 'all' ? loops : loops.filter(loop => loop.workstream === selectedWorkstream);
    const uniquePrograms = new Set(filteredLoops.map(loop => String(loop.phase)).filter(Boolean));
    return Array.from(uniquePrograms).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [loops, selectedWorkstream]);

  const projects = useMemo(() => {
    let filteredLoops = loops;
    if (selectedWorkstream !== 'all') {
      filteredLoops = filteredLoops.filter(loop => loop.workstream === selectedWorkstream);
    }
    if (selectedProgram !== 'all') {
      filteredLoops = filteredLoops.filter(loop => String(loop.phase) === selectedProgram);
    }
    
    // Extract projects from tags (use the first tag as project identifier)
    const uniqueProjects = new Set<string>();
    filteredLoops.forEach(loop => {
      if (loop.tags && loop.tags.length > 0) {
        loop.tags.forEach(tag => uniqueProjects.add(tag));
      }
    });
    return Array.from(uniqueProjects).sort();
  }, [loops, selectedWorkstream, selectedProgram]);

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(loops.map(loop => loop.status).filter(Boolean));
    return Array.from(uniqueStatuses).sort();
  }, [loops]);

  // Apply filters
  const filteredLoops = useMemo(() => {
    return loops.filter(loop => {
      if (selectedWorkstream !== 'all' && loop.workstream !== selectedWorkstream) return false;
      if (selectedProgram !== 'all' && String(loop.phase) !== selectedProgram) return false;
      if (selectedStatus !== 'all' && loop.status !== selectedStatus) return false;
      if (selectedProject !== 'all') {
        if (!loop.tags || !loop.tags.includes(selectedProject)) return false;
      }
      return true;
    });
  }, [loops, selectedWorkstream, selectedProgram, selectedProject, selectedStatus]);

  const clearFilters = () => {
    setSelectedWorkstream('all');
    setSelectedProgram('all');
    setSelectedProject('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = selectedWorkstream !== 'all' || selectedProgram !== 'all' || 
                          selectedProject !== 'all' || selectedStatus !== 'all';

  const getLoopTypeFromTags = (tags: string[]): string => {
    if (tags.includes('planning') || tags.includes('strategy')) return 'Planning';
    if (tags.includes('execution') || tags.includes('task-execution')) return 'Execution';
    if (tags.includes('retrospective') || tags.includes('analysis')) return 'Retrospective';
    return 'Standard';
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workstream Filter Demo</h1>
        <p className="text-muted-foreground">
          Hierarchical filtering: Workstream → Program → Project → Task (Artefact)
        </p>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Hierarchical Filters
          </CardTitle>
          <CardDescription>
            Select filters to narrow down artefacts by their canonical schema hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Workstream Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Workstream</label>
              <Select value={selectedWorkstream} onValueChange={setSelectedWorkstream}>
                <SelectTrigger>
                  <SelectValue placeholder="All Workstreams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workstreams</SelectItem>
                  {workstreams.map(workstream => (
                    <SelectItem key={workstream} value={workstream}>
                      {workstream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Program (Phase)</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(program => (
                    <SelectItem key={program} value={program}>
                      Phase {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Project (Tag)</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLoops.length}</div>
            <div className="text-sm text-muted-foreground">Filtered Artefacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{loops.length}</div>
            <div className="text-sm text-muted-foreground">Total Artefacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{workstreams.length}</div>
            <div className="text-sm text-muted-foreground">Workstreams</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{programs.length}</div>
            <div className="text-sm text-muted-foreground">Programs</div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Tasks/Artefacts ({filteredLoops.length})
          </h2>
          {hasActiveFilters && (
            <Badge variant="secondary">
              Filtered Results
            </Badge>
          )}
        </div>

        {filteredLoops.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                No artefacts found matching the current filter criteria.
              </div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLoops.map((loop) => (
              <Card key={loop.uuid} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{loop.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {loop.summary || 'No summary available'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(loop.status)}>
                        {loop.status}
                      </Badge>
                      <Badge variant="outline">
                        {getLoopTypeFromTags(loop.tags)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Workstream:</span>
                      <div className="text-muted-foreground">{loop.workstream}</div>
                    </div>
                    <div>
                      <span className="font-medium">Program:</span>
                      <div className="text-muted-foreground">Phase {loop.phase}</div>
                    </div>
                    <div>
                      <span className="font-medium">Score:</span>
                      <div className="text-muted-foreground">{loop.score?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="text-muted-foreground">
                        {new Date(loop.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {loop.tags && loop.tags.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-sm">Projects (Tags):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {loop.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">UUID:</span> {loop.uuid}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Origin:</span> {loop.origin}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 