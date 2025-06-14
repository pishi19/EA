import { useState, useCallback } from 'react';
import { Artefact } from './useArtefacts';
import { artefactService } from '../services/artefactService';

export interface BatchState {
    batchMode: boolean;
    selectedTasks: Set<string>;
    loading: boolean;
    error: string | null;
}

export interface UseBatchOperationsReturn {
    batchState: BatchState;
    toggleBatchMode: () => void;
    selectTask: (taskId: string, selected: boolean) => void;
    selectAll: (tasks: Artefact[]) => void;
    selectNone: () => void;
    batchEdit: (tasks: any[], updateData: any) => Promise<void>;
    batchDelete: (tasks: any[]) => Promise<void>;
    clearBatchError: () => void;
}

export function useBatchOperations(
    optimisticArtefacts: Artefact[],
    updateOptimisticArtefacts: (artefacts: Artefact[]) => void,
    onBatchSuccess?: () => void
): UseBatchOperationsReturn {
    
    const [batchState, setBatchState] = useState<BatchState>({
        batchMode: false,
        selectedTasks: new Set(),
        loading: false,
        error: null
    });

    const toggleBatchMode = useCallback(() => {
        setBatchState(prev => ({
            ...prev,
            batchMode: !prev.batchMode,
            selectedTasks: prev.batchMode ? new Set() : prev.selectedTasks
        }));
    }, []);

    const selectTask = useCallback((taskId: string, selected: boolean) => {
        setBatchState(prev => {
            const newSelectedTasks = new Set(prev.selectedTasks);
            if (selected) {
                newSelectedTasks.add(taskId);
            } else {
                newSelectedTasks.delete(taskId);
            }
            return {
                ...prev,
                selectedTasks: newSelectedTasks
            };
        });
    }, []);

    const selectAll = useCallback((tasks: Artefact[]) => {
        setBatchState(prev => ({
            ...prev,
            selectedTasks: new Set(tasks.map(task => task.id))
        }));
    }, []);

    const selectNone = useCallback(() => {
        setBatchState(prev => ({
            ...prev,
            selectedTasks: new Set()
        }));
    }, []);

    const clearBatchError = useCallback(() => {
        setBatchState(prev => ({
            ...prev,
            error: null
        }));
    }, []);

    const batchEdit = useCallback(async (tasks: any[], updateData: any): Promise<void> => {
        try {
            setBatchState(prev => ({ ...prev, loading: true, error: null }));

            // Optimistic updates
            const updatedArtefacts = optimisticArtefacts.map(artefact => {
                const taskToUpdate = tasks.find(task => task.id === artefact.id);
                return taskToUpdate ? { ...artefact, ...updateData } : artefact;
            });
            updateOptimisticArtefacts(updatedArtefacts);

            // API call
            await artefactService.batchOperation('edit', tasks.map(task => ({
                id: task.id,
                ...updateData
            })));

            // Clear selection on success
            setBatchState(prev => ({ 
                ...prev, 
                selectedTasks: new Set(),
                batchMode: false 
            }));
            
            onBatchSuccess?.();

        } catch (error) {
            console.error('Batch edit failed:', error);
            
            setBatchState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Batch edit failed'
            }));
            
            throw error;
        } finally {
            setBatchState(prev => ({ ...prev, loading: false }));
        }
    }, [optimisticArtefacts, updateOptimisticArtefacts, onBatchSuccess]);

    const batchDelete = useCallback(async (tasks: any[]): Promise<void> => {
        const taskIds = tasks.map(task => task.id);
        const originalArtefacts = [...optimisticArtefacts];

        try {
            setBatchState(prev => ({ ...prev, loading: true, error: null }));

            // Optimistic removal
            const filteredArtefacts = optimisticArtefacts.filter(
                artefact => !taskIds.includes(artefact.id)
            );
            updateOptimisticArtefacts(filteredArtefacts);

            // API call
            await artefactService.batchOperation('delete', tasks);

            // Clear selection on success
            setBatchState(prev => ({ 
                ...prev, 
                selectedTasks: new Set(),
                batchMode: false 
            }));
            
            onBatchSuccess?.();

        } catch (error) {
            console.error('Batch delete failed:', error);
            
            // Rollback on failure
            updateOptimisticArtefacts(originalArtefacts);
            
            setBatchState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Batch delete failed'
            }));
            
            throw error;
        } finally {
            setBatchState(prev => ({ ...prev, loading: false }));
        }
    }, [optimisticArtefacts, updateOptimisticArtefacts, onBatchSuccess]);

    return {
        batchState,
        toggleBatchMode,
        selectTask,
        selectAll,
        selectNone,
        batchEdit,
        batchDelete,
        clearBatchError
    };
} 