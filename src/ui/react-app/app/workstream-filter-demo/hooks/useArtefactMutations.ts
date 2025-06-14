import { useState, useCallback } from 'react';
import { Artefact } from './useArtefacts';
import { artefactService } from '../services/artefactService';

export interface MutationState {
    loading: boolean;
    error: string | null;
    pendingMutations: Set<string>;
    failedMutations: Set<string>;
}

export interface UseArtefactMutationsReturn {
    mutationState: MutationState;
    createArtefact: (artefactData: any) => Promise<Artefact>;
    updateArtefact: (artefactId: string, artefactData: any) => Promise<Artefact>;
    deleteArtefact: (artefactId: string) => Promise<void>;
    clearMutationError: () => void;
}

export function useArtefactMutations(
    optimisticArtefacts: Artefact[],
    updateOptimisticArtefacts: (artefacts: Artefact[]) => void,
    onMutationSuccess?: () => void
): UseArtefactMutationsReturn {
    
    const [mutationState, setMutationState] = useState<MutationState>({
        loading: false,
        error: null,
        pendingMutations: new Set(),
        failedMutations: new Set()
    });

    const addPendingMutation = useCallback((id: string) => {
        setMutationState(prev => ({
            ...prev,
            pendingMutations: new Set([...prev.pendingMutations, id])
        }));
    }, []);

    const removePendingMutation = useCallback((id: string) => {
        setMutationState(prev => ({
            ...prev,
            pendingMutations: new Set([...prev.pendingMutations].filter(x => x !== id))
        }));
    }, []);

    const addFailedMutation = useCallback((id: string) => {
        setMutationState(prev => ({
            ...prev,
            failedMutations: new Set([...prev.failedMutations, id])
        }));
    }, []);

    const clearMutationError = useCallback(() => {
        setMutationState(prev => ({
            ...prev,
            error: null,
            failedMutations: new Set()
        }));
    }, []);

    const createArtefact = useCallback(async (artefactData: any): Promise<Artefact> => {
        const tempId = `temp-${Date.now()}`;
        const optimisticArtefact: Artefact = {
            id: tempId,
            name: artefactData.title?.toLowerCase().replace(/\s+/g, '-') || 'new-artefact',
            title: artefactData.title || 'New Artefact',
            phase: artefactData.phase || '',
            workstream: artefactData.workstream || 'ora',
            status: artefactData.status || 'planning',
            score: 0,
            tags: artefactData.tags || [],
            created: new Date().toISOString(),
            uuid: tempId,
            summary: artefactData.summary || '',
            filePath: '',
            origin: 'user',
            type: artefactData.type || 'task'
        };

        try {
            setMutationState(prev => ({ ...prev, loading: true, error: null }));
            addPendingMutation(tempId);

            // Optimistic update
            updateOptimisticArtefacts([optimisticArtefact, ...optimisticArtefacts]);

            // API call
            const result = await artefactService.createArtefact(artefactData);
            
            // Update with real data
            const realArtefact = { ...optimisticArtefact, ...result, id: result.id || tempId };
            const updatedArtefacts = optimisticArtefacts.map(a => 
                a.id === tempId ? realArtefact : a
            );
            updateOptimisticArtefacts(updatedArtefacts);

            removePendingMutation(tempId);
            onMutationSuccess?.();
            
            return realArtefact;

        } catch (error) {
            console.error('Create artefact failed:', error);
            
            // Remove optimistic artefact on failure
            updateOptimisticArtefacts(optimisticArtefacts.filter(a => a.id !== tempId));
            
            addFailedMutation(tempId);
            setMutationState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to create artefact'
            }));
            
            throw error;
        } finally {
            removePendingMutation(tempId);
            setMutationState(prev => ({ ...prev, loading: false }));
        }
    }, [optimisticArtefacts, updateOptimisticArtefacts, onMutationSuccess, addPendingMutation, removePendingMutation, addFailedMutation]);

    const updateArtefact = useCallback(async (artefactId: string, artefactData: any): Promise<Artefact> => {
        const originalArtefact = optimisticArtefacts.find(a => a.id === artefactId);
        if (!originalArtefact) {
            throw new Error('Artefact not found');
        }

        const updatedArtefact = { ...originalArtefact, ...artefactData };

        try {
            setMutationState(prev => ({ ...prev, loading: true, error: null }));
            addPendingMutation(artefactId);

            // Optimistic update
            const updatedArtefacts = optimisticArtefacts.map(a => 
                a.id === artefactId ? updatedArtefact : a
            );
            updateOptimisticArtefacts(updatedArtefacts);

            // API call
            const result = await artefactService.updateArtefact(artefactId, artefactData);
            
            // Update with real data if different
            const realArtefact = { ...updatedArtefact, ...result };
            const finalArtefacts = updatedArtefacts.map(a => 
                a.id === artefactId ? realArtefact : a
            );
            updateOptimisticArtefacts(finalArtefacts);

            removePendingMutation(artefactId);
            onMutationSuccess?.();
            
            return realArtefact;

        } catch (error) {
            console.error('Update artefact failed:', error);
            
            // Rollback on failure
            const rolledBackArtefacts = optimisticArtefacts.map(a => 
                a.id === artefactId ? originalArtefact : a
            );
            updateOptimisticArtefacts(rolledBackArtefacts);
            
            addFailedMutation(artefactId);
            setMutationState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to update artefact'
            }));
            
            throw error;
        } finally {
            removePendingMutation(artefactId);
            setMutationState(prev => ({ ...prev, loading: false }));
        }
    }, [optimisticArtefacts, updateOptimisticArtefacts, onMutationSuccess, addPendingMutation, removePendingMutation, addFailedMutation]);

    const deleteArtefact = useCallback(async (artefactId: string): Promise<void> => {
        const artefactToDelete = optimisticArtefacts.find(a => a.id === artefactId);
        if (!artefactToDelete) {
            throw new Error('Artefact not found');
        }

        try {
            setMutationState(prev => ({ ...prev, loading: true, error: null }));
            addPendingMutation(artefactId);

            // Optimistic removal
            const filteredArtefacts = optimisticArtefacts.filter(a => a.id !== artefactId);
            updateOptimisticArtefacts(filteredArtefacts);

            // API call
            await artefactService.deleteArtefact(artefactId);

            removePendingMutation(artefactId);
            onMutationSuccess?.();

        } catch (error) {
            console.error('Delete artefact failed:', error);
            
            // Restore on failure
            updateOptimisticArtefacts([...optimisticArtefacts, artefactToDelete]);
            
            addFailedMutation(artefactId);
            setMutationState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to delete artefact'
            }));
            
            throw error;
        } finally {
            removePendingMutation(artefactId);
            setMutationState(prev => ({ ...prev, loading: false }));
        }
    }, [optimisticArtefacts, updateOptimisticArtefacts, onMutationSuccess, addPendingMutation, removePendingMutation, addFailedMutation]);

    return {
        mutationState,
        createArtefact,
        updateArtefact,
        deleteArtefact,
        clearMutationError
    };
} 