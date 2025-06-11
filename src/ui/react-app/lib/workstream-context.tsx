'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface WorkstreamConfig {
    name: string;
    displayName: string;
    description: string;
    owner?: string;
    created: string;
    status: 'active' | 'archived' | 'planning';
    color?: string;
}

export interface WorkstreamContextType {
    // Current workstream state
    currentWorkstream: string;
    workstreamConfig: WorkstreamConfig | null;
    
    // Available workstreams
    availableWorkstreams: WorkstreamConfig[];
    
    // Navigation helpers
    navigateToWorkstream: (workstreamName: string, page?: string) => void;
    getWorkstreamUrl: (workstreamName: string, page?: string) => string;
    
    // Workstream detection
    extractWorkstreamFromUrl: () => string | null;
    isValidWorkstream: (name: string) => boolean;
    
    // Loading states
    loading: boolean;
    error: string | null;
    
    // Registry management
    registerWorkstream: (config: WorkstreamConfig) => void;
    refreshWorkstreams: () => Promise<void>;
}

const WorkstreamContext = createContext<WorkstreamContextType | null>(null);

// Default workstream configurations
const DEFAULT_WORKSTREAMS: WorkstreamConfig[] = [
    {
        name: 'ora',
        displayName: 'Ora System',
        description: 'Context-aware Autonomous Agent - Core system development',
        owner: 'System',
        created: '2025-01-01',
        status: 'active',
        color: '#3b82f6'
    },
    {
        name: 'mecca',
        displayName: 'Mecca Project',
        description: 'Strategic business development initiative',
        owner: 'Business',
        created: '2025-01-01',
        status: 'planning',
        color: '#10b981'
    },
    {
        name: 'sales',
        displayName: 'Sales & Marketing',
        description: 'Customer acquisition and marketing operations',
        owner: 'Revenue',
        created: '2025-01-01',
        status: 'planning',
        color: '#8b5cf6'
    }
];

interface WorkstreamProviderProps {
    children: ReactNode;
    defaultWorkstream?: string;
}

export function WorkstreamProvider({ children, defaultWorkstream }: WorkstreamProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Remove hardcoded default - require explicit workstream detection
    const [currentWorkstream, setCurrentWorkstream] = useState<string>(defaultWorkstream || '');
    const [availableWorkstreams, setAvailableWorkstreams] = useState<WorkstreamConfig[]>(DEFAULT_WORKSTREAMS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract workstream from current URL
    const extractWorkstreamFromUrl = (): string | null => {
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'workstream' && pathParts[1]) {
            return pathParts[1];
        }
        return null;
    };

    // Check if workstream name is valid
    const isValidWorkstream = (name: string): boolean => {
        return availableWorkstreams.some(ws => ws.name === name);
    };

    // Get current workstream config
    const workstreamConfig = availableWorkstreams.find(ws => ws.name === currentWorkstream) || null;

    // Navigate to specific workstream and page
    const navigateToWorkstream = (workstreamName: string, page?: string) => {
        if (!isValidWorkstream(workstreamName)) {
            console.warn(`Invalid workstream: ${workstreamName}`);
            return;
        }
        
        const url = getWorkstreamUrl(workstreamName, page);
        router.push(url);
    };

    // Generate workstream URL
    const getWorkstreamUrl = (workstreamName: string, page?: string): string => {
        if (page) {
            return `/workstream/${workstreamName}/${page}`;
        }
        return `/workstream/${workstreamName}`;
    };

    // Register new workstream
    const registerWorkstream = (config: WorkstreamConfig) => {
        setAvailableWorkstreams(prev => {
            const exists = prev.find(ws => ws.name === config.name);
            if (exists) {
                return prev.map(ws => ws.name === config.name ? config : ws);
            }
            return [...prev, config];
        });
    };

    // Refresh workstreams from API/registry
    const refreshWorkstreams = async () => {
        setLoading(true);
        try {
            // TODO: Implement API call to load workstreams
            // const response = await fetch('/api/workstreams');
            // const workstreams = await response.json();
            // setAvailableWorkstreams(workstreams);
            
            // For now, use defaults
            setAvailableWorkstreams(DEFAULT_WORKSTREAMS);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workstreams');
        } finally {
            setLoading(false);
        }
    };

    // Update current workstream based on URL changes
    useEffect(() => {
        const workstreamFromUrl = extractWorkstreamFromUrl();
        if (workstreamFromUrl && isValidWorkstream(workstreamFromUrl)) {
            setCurrentWorkstream(workstreamFromUrl);
        } else if (workstreamFromUrl && !isValidWorkstream(workstreamFromUrl)) {
            // Invalid workstream in URL - redirect to workstream selection
            console.warn(`Invalid workstream in URL: ${workstreamFromUrl}`);
            setError(`Invalid workstream: ${workstreamFromUrl}`);
            router.push('/'); // Redirect to home page for workstream selection
        } else if (!workstreamFromUrl && !currentWorkstream) {
            // No workstream detected and none set - require explicit selection
            console.log('No workstream context detected - requiring explicit selection');
        }
    }, [pathname, router, availableWorkstreams, currentWorkstream]);

    // Initialize workstreams on mount
    useEffect(() => {
        refreshWorkstreams();
    }, []);

    const value: WorkstreamContextType = {
        currentWorkstream,
        workstreamConfig,
        availableWorkstreams,
        navigateToWorkstream,
        getWorkstreamUrl,
        extractWorkstreamFromUrl,
        isValidWorkstream,
        loading,
        error,
        registerWorkstream,
        refreshWorkstreams
    };

    return (
        <WorkstreamContext.Provider value={value}>
            {children}
        </WorkstreamContext.Provider>
    );
}

export function useWorkstream(): WorkstreamContextType {
    const context = useContext(WorkstreamContext);
    if (!context) {
        throw new Error('useWorkstream must be used within a WorkstreamProvider');
    }
    return context;
}

// Utility hooks for common workstream operations
export function useWorkstreamNavigation() {
    const { navigateToWorkstream, getWorkstreamUrl, currentWorkstream } = useWorkstream();
    
    return {
        navigateToPage: (page: string) => navigateToWorkstream(currentWorkstream, page),
        getPageUrl: (page: string) => getWorkstreamUrl(currentWorkstream, page),
        navigateToWorkstream,
        getWorkstreamUrl
    };
}

export function useCurrentWorkstream() {
    const { currentWorkstream, workstreamConfig } = useWorkstream();
    return { workstream: currentWorkstream, config: workstreamConfig };
} 