import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Users, Target, CheckSquare, Search, X } from "lucide-react";
import { TaskFilterState, TaskFilterOptions } from '../hooks/useTaskFilters';

interface TaskFilterControlsProps {
    filters: TaskFilterState;
    filterOptions: TaskFilterOptions;
    onFilterChange: (key: keyof TaskFilterState, value: string) => void;
    onClearFilters: () => void;
    totalCount: number;
    filteredCount: number;
}

export default function TaskFilterControls({
    filters,
    filterOptions,
    onFilterChange,
    onClearFilters,
    totalCount,
    filteredCount
}: TaskFilterControlsProps) {
    // Enhanced helper function to filter out invalid values for SelectItem components
    const filterValidValues = (items: string[]): string[] => {
        if (!Array.isArray(items)) {
            return [];
        }
        
        return items.filter(item => {
            try {
                // Must be a non-empty string after trimming
                return item && 
                    typeof item === 'string' && 
                    item.trim() !== '' &&
                    item !== 'all'; // Exclude our special "all" value
            } catch (error) {
                console.warn('Invalid filter item:', item, error);
                return false;
            }
        });
    };

    // Filter all arrays to ensure no empty values reach SelectItem
    const validSections = filterValidValues(filterOptions.sections || []);
    const validStatuses = filterValidValues(filterOptions.statuses || []);
    const validAddedByOptions = filterValidValues(filterOptions.addedByOptions || []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Task Filters
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    {/* Section Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Target className="inline h-4 w-4 mr-1" />
                            Section
                        </label>
                        <Select value={filters.section} onValueChange={(value) => onFilterChange('section', value)}>
                            <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sections</SelectItem>
                                {validSections.map(section => (
                                    <SelectItem key={section} value={section}>{section}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="h-4 text-xs text-gray-500 mt-1">
                            Filter by task section
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <CheckSquare className="inline h-4 w-4 mr-1" />
                            Status
                        </label>
                        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
                            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {validStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="h-4 text-xs text-gray-500 mt-1">
                            Filter by completion status
                        </div>
                    </div>

                    {/* Added By Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Users className="inline h-4 w-4 mr-1" />
                            Added By
                        </label>
                        <Select value={filters.addedBy} onValueChange={(value) => onFilterChange('addedBy', value)}>
                            <SelectTrigger><SelectValue placeholder="All sources" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sources</SelectItem>
                                {validAddedByOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="h-4 text-xs text-gray-500 mt-1">
                            Filter by creator
                        </div>
                    </div>

                    {/* Search Filter */}
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1 h-6 flex items-center">
                            <Search className="inline h-4 w-4 mr-1" />
                            Search
                        </label>
                        <Input
                            type="text"
                            placeholder="Search tasks..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                        />
                        <div className="h-4 text-xs text-gray-500 mt-1">
                            Search in all fields
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex flex-col">
                        <div className="h-6 mb-1"></div> {/* Spacer to align with other columns */}
                        <Button 
                            onClick={onClearFilters} 
                            variant="outline" 
                            className="w-full"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                        <div className="h-4 mt-1"></div> {/* Spacer to align with other columns */}
                    </div>

                    {/* Statistics Display */}
                    <div className="flex flex-col">
                        <div className="h-6 mb-1"></div> {/* Spacer to align with other columns */}
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-sm font-medium">Total: {totalCount}</div>
                            <div className="text-sm text-gray-600">Shown: {filteredCount}</div>
                        </div>
                        <div className="h-4 mt-1"></div> {/* Spacer to align with other columns */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 