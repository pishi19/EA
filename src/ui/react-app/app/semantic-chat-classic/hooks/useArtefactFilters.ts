import { useState, useMemo, useCallback } from 'react';
import { Artefact } from '../services/artefactService';

export interface ArtefactFilterState {
    phase: string;
    status: string;
    workstream: string;
    search: string;
    tags: string[];
}

export interface ArtefactFilterOptions {
    phases: string[];
    statuses: string[];
    workstreams: string[];
    tags: string[];
}

export interface UseArtefactFiltersResult {
    filters: ArtefactFilterState;
    filterOptions: ArtefactFilterOptions;
    filteredArtefacts: Artefact[];
    setFilter: (key: keyof ArtefactFilterState, value: string | string[]) => void;
    clearFilters: () => void;
    activeFilterCount: number;
    isFiltered: boolean;
}

const initialFilters: ArtefactFilterState = {
    phase: 'all',
    status: 'all',
    workstream: 'all',
    search: '',
    tags: [],
};

// Helper function to check if a filter is active
const isFilterActive = (filterValue: string | string[]): boolean => {
    if (Array.isArray(filterValue)) {
        return filterValue.length > 0;
    }
    return Boolean(filterValue && filterValue !== 'all' && filterValue.trim() !== '');
};

// Helper function to safely extract unique values
const extractUniqueValues = (artefacts: Artefact[], extractor: (artefact: Artefact) => string | undefined): string[] => {
    if (!Array.isArray(artefacts)) {
        return [];
    }

    try {
        const values = artefacts
            .map(artefact => {
                try {
                    const value = extractor(artefact);
                    return value && typeof value === 'string' ? value.trim() : null;
                } catch (error) {
                    console.warn('Error extracting value from artefact:', error, artefact);
                    return null;
                }
            })
            .filter((value): value is string => {
                return value !== null && 
                    value !== '' && 
                    value !== 'all' &&
                    typeof value === 'string';
            });
        
        return Array.from(new Set(values)).sort();
    } catch (error) {
        console.error('Error in extractUniqueValues:', error);
        return [];
    }
};

export function useArtefactFilters(artefacts: Artefact[]): UseArtefactFiltersResult {
    const [filters, setFilters] = useState<ArtefactFilterState>(initialFilters);

    // Generate filter options from artefacts
    const filterOptions = useMemo((): ArtefactFilterOptions => {
        const safeArtefacts = Array.isArray(artefacts) ? artefacts : [];

        try {
            const phases = extractUniqueValues(safeArtefacts, a => a?.phase);
            const statuses = extractUniqueValues(safeArtefacts, a => a?.status);
            const workstreams = extractUniqueValues(safeArtefacts, a => a?.workstream);
            
            // Extract tags differently since it's an array
            const allTags = safeArtefacts
                .flatMap(a => a?.tags || [])
                .filter((tag): tag is string => Boolean(tag && typeof tag === 'string'))
                .map(tag => tag.trim())
                .filter(tag => tag !== '');
            
            const tags = Array.from(new Set(allTags)).sort();

            return {
                phases,
                statuses,
                workstreams,
                tags,
            };
        } catch (error) {
            console.error('Error generating filter options:', error);
            return {
                phases: [],
                statuses: [],
                workstreams: [],
                tags: [],
            };
        }
    }, [artefacts]);

    // Apply filters to artefacts
    const filteredArtefacts = useMemo(() => {
        const safeArtefacts = Array.isArray(artefacts) ? artefacts : [];

        return safeArtefacts.filter(artefact => {
            try {
                // Ensure artefact is an object
                if (!artefact || typeof artefact !== 'object') {
                    return false;
                }

                // Phase filter
                if (isFilterActive(filters.phase) && artefact.phase !== filters.phase) {
                    return false;
                }

                // Status filter
                if (isFilterActive(filters.status) && artefact.status !== filters.status) {
                    return false;
                }

                // Workstream filter
                if (isFilterActive(filters.workstream) && artefact.workstream !== filters.workstream) {
                    return false;
                }

                // Tags filter (AND logic - artefact must have all selected tags)
                if (isFilterActive(filters.tags)) {
                    const artefactTags = artefact.tags || [];
                    const hasAllTags = filters.tags.every(tag => artefactTags.includes(tag));
                    if (!hasAllTags) {
                        return false;
                    }
                }

                // Search filter
                if (isFilterActive(filters.search)) {
                    const searchTerm = filters.search.toLowerCase();
                    const searchableFields = [
                        artefact.title,
                        artefact.name,
                        artefact.summary,
                        ...(artefact.tags || [])
                    ];
                    
                    const searchableText = searchableFields
                        .filter(field => field && typeof field === 'string')
                        .join(' ')
                        .toLowerCase();
                    
                    if (!searchableText.includes(searchTerm)) {
                        return false;
                    }
                }

                return true;
            } catch (error) {
                console.error('Error filtering artefact:', error, artefact);
                return false;
            }
        });
    }, [artefacts, filters]);

    // Set a single filter
    const setFilter = useCallback((key: keyof ArtefactFilterState, value: string | string[]) => {
        try {
            setFilters(prev => ({
                ...prev,
                [key]: value,
            }));
        } catch (error) {
            console.error('Error setting filter:', error);
        }
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        try {
            setFilters(initialFilters);
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    }, []);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (isFilterActive(filters.phase)) count++;
        if (isFilterActive(filters.status)) count++;
        if (isFilterActive(filters.workstream)) count++;
        if (isFilterActive(filters.search)) count++;
        if (isFilterActive(filters.tags)) count++;
        return count;
    }, [filters]);

    // Check if any filters are active
    const isFiltered = useMemo(() => {
        return activeFilterCount > 0;
    }, [activeFilterCount]);

    return {
        filters,
        filterOptions,
        filteredArtefacts,
        setFilter,
        clearFilters,
        activeFilterCount,
        isFiltered,
    };
} 