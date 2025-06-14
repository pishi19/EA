import { useState, useEffect, useCallback } from 'react';
import { useWorkstream } from '@/lib/workstream-context';
import { artefactService } from '../services/artefactService';

export interface Artefact {
    id: string;
    name: string;
    title: string;
    phase: string;
    workstream: string;
    program?: string;
    status: string;
    score: number;
    tags: string[];
    created: string;
    uuid: string;
    summary: string;
    filePath: string;
    origin: string;
    type?: string;
}

export interface UseArtefactsReturn {
    artefacts: Artefact[];
    optimisticArtefacts: Artefact[];
    loading: boolean;
    error: string | null;
    refetchArtefacts: () => Promise<void>;
    updateOptimisticArtefacts: (artefacts: Artefact[]) => void;
}

export function useArtefacts(): UseArtefactsReturn {
    const workstreamContext = useWorkstream();
    const currentWorkstream = workstreamContext?.currentWorkstream || 'ora';
    const isValidWorkstream = workstreamContext?.isValidWorkstream || ((ws: string) => ws === 'ora');
    
    const [artefacts, setArtefacts] = useState<Artefact[]>([]);
    const [optimisticArtefacts, setOptimisticArtefacts] = useState<Artefact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadArtefacts = useCallback(async (workstream?: string) => {
        try {
            console.log('Loading artefacts for workstream:', workstream || currentWorkstream);
            setLoading(true);
            setError(null);
            
            const targetWorkstream = workstream || currentWorkstream || 'ora';
            
            const data = await artefactService.getArtefacts(targetWorkstream);
            console.log('Artefacts loaded:', data.length);
            setArtefacts(data);
            
        } catch (err) {
            console.error('Error loading artefacts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load artefacts');
        } finally {
            setLoading(false);
        }
    }, [currentWorkstream]);

    const refetchArtefacts = useCallback(() => {
        return loadArtefacts();
    }, [loadArtefacts]);

    const updateOptimisticArtefacts = useCallback((updatedArtefacts: Artefact[]) => {
        setOptimisticArtefacts(updatedArtefacts);
    }, []);

    // Load artefacts on mount and when workstream changes
    useEffect(() => {
        console.log('useArtefacts effect triggered, currentWorkstream:', currentWorkstream);
        
        const loadData = async () => {
            try {
                console.log('Loading artefacts for workstream:', currentWorkstream);
                setLoading(true);
                setError(null);
                
                const targetWorkstream = currentWorkstream || 'ora';
                const data = await artefactService.getArtefacts(targetWorkstream);
                console.log('Artefacts loaded:', data.length);
                setArtefacts(data);
                
            } catch (err) {
                console.error('Error loading artefacts:', err);
                setError(err instanceof Error ? err.message : 'Failed to load artefacts');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [currentWorkstream]);

    // Sync optimistic artefacts with real artefacts
    useEffect(() => {
        if (artefacts.length > 0) {
            setOptimisticArtefacts(artefacts);
        }
    }, [artefacts]);

    return {
        artefacts,
        optimisticArtefacts,
        loading,
        error,
        refetchArtefacts,
        updateOptimisticArtefacts
    };
} 