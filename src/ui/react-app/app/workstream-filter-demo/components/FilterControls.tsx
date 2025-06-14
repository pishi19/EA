import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Target, FolderOpen, Calendar, FileText, CheckSquare } from "lucide-react";
import { FilterState, FilterOptions } from '../hooks/useArtefactFilters';

interface FilterControlsProps {
    filters: FilterState;
    filterOptions: FilterOptions;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onClearFilters: () => void;
    totalCount: number;
    filteredCount: number;
    roadmapLoading?: boolean;
    roadmapError?: boolean;
}

export function FilterControls({
    filters,
    filterOptions,
    onFilterChange,
    onClearFilters,
    totalCount,
    filteredCount,
    roadmapLoading,
    roadmapError
}: FilterControlsProps) {
    // Helper function to filter out empty string values for SelectItem components
    const filterValidValues = <T extends { id?: string }>(
        items: T[], 
        getValue: (item: T) => string
    ): T[] => {
        return items.filter(item => {
            try {
                const value = getValue(item);
                return value && typeof value === 'string' && value.trim() !== '';
            } catch (error) {
                // If getValue throws an error or value is not valid, filter it out
                return false;
            }
        });
    };

    // Filter out invalid values with better type safety
    const validWorkstreams = filterOptions.workstreams.filter(ws => 
        ws && typeof ws === 'string' && ws.trim() !== ''
    );
    const validPrograms = filterValidValues(filterOptions.programs, p => p.id);
    const validProjects = filterValidValues(filterOptions.projects, p => p.id);
    const validTasks = filterValidValues(filterOptions.tasks, t => t.id);
    const validArtefactTypes = filterOptions.artefactTypes.filter(type => 
        type && typeof type === 'string' && type.trim() !== ''
    );
    const validStatuses = filterOptions.statuses.filter(status => 
        status && typeof status === 'string' && status.trim() !== ''
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>🏗️ Workstreams</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Hierarchical filtering based on roadmap.md structure: Workstream → Program → Project → Task → Artefact Type → Status
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
                    {/* Workstream Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Users className="inline h-4 w-4 mr-1" />
                            Workstream
                        </label>
                        <Select value={filters.workstream} onValueChange={(value) => onFilterChange('workstream', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validWorkstreams.map(ws => (
                                    <SelectItem key={ws} value={ws}>
                                        {ws === 'all' ? 'All Workstreams' : ws}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validWorkstreams.length - 1} canonical workstreams
                        </p>
                    </div>

                    {/* Program Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Target className="inline h-4 w-4 mr-1" />
                            Program
                        </label>
                        <Select value={filters.program} onValueChange={(value) => onFilterChange('program', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validPrograms.map(program => (
                                    <SelectItem key={program.id} value={program.id}>
                                        {program.name === 'All Programs' ? 'All Programs' : program.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validPrograms.length - 1} programs from roadmap.md
                        </p>
                    </div>

                    {/* Project Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <FolderOpen className="inline h-4 w-4 mr-1" />
                            Project
                        </label>
                        <Select value={filters.project} onValueChange={(value) => onFilterChange('project', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validProjects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name === 'All Projects' ? 'All Projects' : project.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validProjects.length - 1} projects from roadmap.md
                        </p>
                    </div>

                    {/* Task Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <CheckSquare className="inline h-4 w-4 mr-1" />
                            Task
                        </label>
                        <Select value={filters.task} onValueChange={(value) => onFilterChange('task', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validTasks.map(task => (
                                    <SelectItem key={task.id} value={task.id}>
                                        {task.name === 'All Tasks' ? 'All Tasks' : task.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validTasks.length - 1} tasks from roadmap.md
                        </p>
                    </div>

                    {/* Artefact Type Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <FileText className="inline h-4 w-4 mr-1" />
                            Artefact Type
                        </label>
                        <Select value={filters.artefactType} onValueChange={(value) => onFilterChange('artefactType', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validArtefactTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type === 'all' ? 'All Types' : type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validArtefactTypes.length - 1} types available
                        </p>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Status
                        </label>
                        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {validStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status === 'all' ? 'All Statuses' : status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1 h-4">
                            {validStatuses.length - 1} statuses available
                        </p>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex flex-col">
                        <div className="h-6 mb-1"></div> {/* Spacer to match label height */}
                        <Button 
                            variant="outline" 
                            onClick={onClearFilters}
                        >
                            Clear Filters
                        </Button>
                        <div className="h-4 mt-1"></div> {/* Spacer to match help text height */}
                    </div>

                    {/* Statistics Display */}
                    <div className="flex flex-col">
                        <div className="h-6 mb-1"></div> {/* Spacer to match label height */}
                        <div className="text-sm bg-gray-50 p-2 rounded border">
                            <div>Total: <strong>{totalCount}</strong></div>
                            <div>Shown: <strong>{filteredCount}</strong></div>
                            {roadmapLoading && (
                                <div className="text-orange-600 text-xs mt-1">Loading roadmap...</div>
                            )}
                            {roadmapError && (
                                <div className="text-red-600 text-xs mt-1">Roadmap error</div>
                            )}
                        </div>
                        <div className="h-4 mt-1"></div> {/* Spacer to match help text height */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 