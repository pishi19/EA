import { useState, useMemo } from 'react';
import { Task } from '../services/taskService';

export interface TaskFilterState {
    section: string;
    status: string;
    addedBy: string;
    search: string;
}

export interface TaskFilterOptions {
    sections: string[];
    statuses: string[];
    addedByOptions: string[];
}

export interface UseTaskFiltersResult {
    filters: TaskFilterState;
    filterOptions: TaskFilterOptions;
    filteredTasks: Task[];
    setFilter: (key: keyof TaskFilterState, value: string) => void;
    clearFilters: () => void;
}

const initialFilters: TaskFilterState = {
    section: 'all',
    status: 'all',
    addedBy: 'all',
    search: '',
};

// Helper function to safely extract and filter unique values
const extractUniqueValues = (tasks: Task[], extractor: (task: Task) => string): string[] => {
    if (!Array.isArray(tasks)) {
        return [];
    }

    try {
        const values = tasks
            .map(task => {
                try {
                    const value = extractor(task);
                    return value && typeof value === 'string' ? value.trim() : null;
                } catch (error) {
                    console.warn('Error extracting value from task:', error, task);
                    return null;
                }
            })
            .filter((value): value is string => {
                return value !== null && 
                    value !== '' && 
                    value !== 'all' && // Exclude our special "all" value
                    typeof value === 'string';
            });
        
        return Array.from(new Set(values)).sort();
    } catch (error) {
        console.error('Error in extractUniqueValues:', error);
        return [];
    }
};

// Helper function to check if a filter is active (not "all" or empty)
const isFilterActive = (filterValue: string): boolean => {
    return Boolean(filterValue && filterValue !== 'all' && filterValue.trim() !== '');
};

export function useTaskFilters(tasks: Task[]): UseTaskFiltersResult {
    const [filters, setFilters] = useState<TaskFilterState>(initialFilters);

    // Generate filter options from tasks with comprehensive validation
    const filterOptions = useMemo((): TaskFilterOptions => {
        // Ensure tasks is an array
        const safeTasks = Array.isArray(tasks) ? tasks : [];

        try {
            const sections = extractUniqueValues(safeTasks, t => t?.section);
            const statuses = extractUniqueValues(safeTasks, t => t?.status);
            const addedByOptions = extractUniqueValues(safeTasks, t => t?.added_by);

            return {
                sections,
                statuses,
                addedByOptions,
            };
        } catch (error) {
            console.error('Error generating filter options:', error);
            // Return empty arrays if there's an error
            return {
                sections: [],
                statuses: [],
                addedByOptions: [],
            };
        }
    }, [tasks]);

    // Apply filters with safe property access and proper "all" handling
    const filteredTasks = useMemo(() => {
        // Ensure tasks is an array
        const safeTasks = Array.isArray(tasks) ? tasks : [];

        return safeTasks.filter(task => {
            try {
                // Ensure task is an object
                if (!task || typeof task !== 'object') {
                    return false;
                }

                // Section filter - only apply if filter is active
                if (isFilterActive(filters.section) && task.section !== filters.section) {
                    return false;
                }

                // Status filter - only apply if filter is active
                if (isFilterActive(filters.status) && task.status !== filters.status) {
                    return false;
                }

                // Added by filter - only apply if filter is active
                if (isFilterActive(filters.addedBy) && task.added_by !== filters.addedBy) {
                    return false;
                }

                // Search filter - only apply if search term exists
                if (filters.search && filters.search.trim() !== '') {
                    const searchTerm = filters.search.toLowerCase();
                    const searchableFields = [
                        task.description,
                        task.context,
                        task.source,
                        task.promoted_to
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
                console.error('Error filtering task:', error, task);
                // If there's an error processing this task, exclude it
                return false;
            }
        });
    }, [tasks, filters]);

    const setFilter = (key: keyof TaskFilterState, value: string) => {
        try {
            setFilters(prev => ({
                ...prev,
                [key]: value || 'all', // Use 'all' instead of empty string
            }));
        } catch (error) {
            console.error('Error setting filter:', error);
        }
    };

    const clearFilters = () => {
        try {
            setFilters(initialFilters);
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    };

    return {
        filters,
        filterOptions,
        filteredTasks,
        setFilter,
        clearFilters,
    };
} 