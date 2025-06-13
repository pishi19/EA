import { useState, useMemo, useCallback } from 'react';
import { DocFile } from '../services/docService';

export interface DocFilterState {
    search: string;
    tags: string[];
    sortBy: 'name' | 'date' | 'size';
    sortOrder: 'asc' | 'desc';
}

export interface DocFilterOptions {
    allTags: string[];
    searchSuggestions: string[];
}

export interface UseDocFiltersResult {
    filters: DocFilterState;
    filterOptions: DocFilterOptions;
    filteredDocuments: DocFile[];
    setSearch: (search: string) => void;
    setTagFilter: (tags: string[]) => void;
    setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
    setSortOrder: (order: 'asc' | 'desc') => void;
    clearFilters: () => void;
    activeFilterCount: number;
    isFiltered: boolean;
}

const initialFilters: DocFilterState = {
    search: '',
    tags: [],
    sortBy: 'name',
    sortOrder: 'asc',
};

export function useDocFilters(documents: DocFile[]): UseDocFiltersResult {
    const [filters, setFilters] = useState<DocFilterState>(initialFilters);

    // Generate filter options from documents
    const filterOptions = useMemo((): DocFilterOptions => {
        const allTags = new Set<string>();
        const searchSuggestions = new Set<string>();

        documents.forEach(doc => {
            // Collect all unique tags
            doc.tags.forEach(tag => allTags.add(tag));
            
            // Add titles and filenames as search suggestions
            searchSuggestions.add(doc.title);
            searchSuggestions.add(doc.friendlyName);
        });

        return {
            allTags: Array.from(allTags).sort(),
            searchSuggestions: Array.from(searchSuggestions).sort(),
        };
    }, [documents]);

    // Filter and sort documents
    const filteredDocuments = useMemo((): DocFile[] => {
        let filtered = [...documents];

        // Apply search filter
        if (filters.search.trim()) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.title.toLowerCase().includes(searchLower) ||
                doc.friendlyName.toLowerCase().includes(searchLower) ||
                doc.filename.toLowerCase().includes(searchLower) ||
                doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        // Apply tag filter
        if (filters.tags.length > 0) {
            filtered = filtered.filter(doc =>
                filters.tags.every(filterTag =>
                    doc.tags.some(docTag => docTag === filterTag)
                )
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'name':
                    comparison = a.friendlyName.localeCompare(b.friendlyName);
                    break;
                case 'date':
                    comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                default:
                    comparison = 0;
            }

            return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
    }, [documents, filters]);

    // Filter setters
    const setSearch = useCallback((search: string) => {
        setFilters(prev => ({ ...prev, search }));
    }, []);

    const setTagFilter = useCallback((tags: string[]) => {
        setFilters(prev => ({ ...prev, tags }));
    }, []);

    const setSortBy = useCallback((sortBy: 'name' | 'date' | 'size') => {
        setFilters(prev => ({ ...prev, sortBy }));
    }, []);

    const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
        setFilters(prev => ({ ...prev, sortOrder }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.search.trim()) count++;
        if (filters.tags.length > 0) count++;
        if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++;
        return count;
    }, [filters]);

    const isFiltered = activeFilterCount > 0;

    return {
        filters,
        filterOptions,
        filteredDocuments,
        setSearch,
        setTagFilter,
        setSortBy,
        setSortOrder,
        clearFilters,
        activeFilterCount,
        isFiltered,
    };
}
