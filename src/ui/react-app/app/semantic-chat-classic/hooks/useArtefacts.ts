import { useState, useEffect, useCallback } from 'react';
import { useWorkstream } from '@/lib/workstream-context';
import { artefactService, Artefact, ArtefactResponse } from '../services/artefactService';

export interface UseArtefactsResult {
    artefacts: Artefact[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentWorkstream: string;
    refreshArtefacts: () => Promise<void>;
    searchArtefacts: (query: string) => Promise<Artefact[]>;
    getArtefactById: (id: string) => Artefact | undefined;
}

export function useArtefacts(): UseArtefactsResult {
    const [artefacts, setArtefacts] = useState<Artefact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    
    const { currentWorkstream, isValidWorkstream } = useWorkstream();

    // Get the effective workstream (fallback to 'ora' if invalid)
    const effectiveWorkstream = (currentWorkstream && isValidWorkstream(currentWorkstream)) 
        ? currentWorkstream 
        : 'ora';

    const loadArtefacts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response: ArtefactResponse = await artefactService.fetchArtefacts(effectiveWorkstream);
            
            setArtefacts(response.artefacts);
            setTotalCount(response.total);
            
        } catch (err) {
            console.error('Error loading artefacts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load artefacts');
            setArtefacts([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [effectiveWorkstream]);

    // Load artefacts when workstream changes
    useEffect(() => {
        loadArtefacts();
    }, [loadArtefacts]);

    // Refresh artefacts (re-fetch from API)
    const refreshArtefacts = useCallback(async () => {
        await loadArtefacts();
    }, [loadArtefacts]);

    // Search artefacts
    const searchArtefacts = useCallback(async (query: string): Promise<Artefact[]> => {
        try {
            if (!query.trim()) {
                return artefacts;
            }
            return await artefactService.searchArtefacts(query, effectiveWorkstream);
        } catch (err) {
            console.error('Error searching artefacts:', err);
            return [];
        }
    }, [artefacts, effectiveWorkstream]);

    // Get artefact by ID
    const getArtefactById = useCallback((id: string): Artefact | undefined => {
        return artefacts.find(artefact => artefact.id === id);
    }, [artefacts]);

    return {
        artefacts,
        loading,
        error,
        totalCount,
        currentWorkstream: effectiveWorkstream,
        refreshArtefacts,
        searchArtefacts,
        getArtefactById
    };
} 