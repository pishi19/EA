import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Filter, Search, X, ArrowUpDown } from 'lucide-react';
import { DocFilterState, DocFilterOptions } from '../hooks/useDocFilters';

interface DocFilterControlsProps {
    filters: DocFilterState;
    filterOptions: DocFilterOptions;
    onSearchChange: (search: string) => void;
    onTagFilterChange: (tags: string[]) => void;
    onSortByChange: (sortBy: 'name' | 'date' | 'size') => void;
    onSortOrderChange: (order: 'asc' | 'desc') => void;
    onClearFilters: () => void;
    totalCount: number;
    filteredCount: number;
    activeFilterCount: number;
    className?: string;
}

export default function DocFilterControls({
    filters,
    filterOptions,
    onSearchChange,
    onTagFilterChange,
    onSortByChange,
    onSortOrderChange,
    onClearFilters,
    totalCount,
    filteredCount,
    activeFilterCount,
    className = "",
}: DocFilterControlsProps) {
    const handleTagToggle = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter(t => t !== tag)
            : [...filters.tags, tag];
        onTagFilterChange(newTags);
    };

    return (
        <Card className={`mb-6 ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        📄 System Documentation
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                            {filteredCount} of {totalCount} documents
                        </span>
                        {activeFilterCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="flex items-center gap-1"
                            >
                                <X className="h-3 w-3" />
                                Clear ({activeFilterCount})
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search documents..."
                                value={filters.search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={filters.sortBy} onValueChange={onSortByChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="date">Date Modified</SelectItem>
                                <SelectItem value="size">File Size</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Order</label>
                        <Select value={filters.sortOrder} onValueChange={onSortOrderChange}>
                            <SelectTrigger>
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Active Tags ({filters.tags.length})
                        </label>
                        <div className="min-h-[40px] border rounded-md p-2 flex flex-wrap gap-1">
                            {filters.tags.length > 0 ? (
                                filters.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-xs cursor-pointer hover:bg-red-100"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                        <X className="h-3 w-3 ml-1" />
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground self-center">
                                    No tags selected
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Tags */}
                {filterOptions.allTags.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium">Available Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.allTags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                                    className="text-xs cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
