import { useState, useCallback } from 'react';
import { Task } from '../services/taskService';

export interface UseBatchTaskOperationsResult {
    batchMode: boolean;
    selectedTasks: Set<string>;
    toggleBatchMode: () => void;
    selectAll: () => void;
    selectNone: () => void;
    toggleTaskSelection: (taskId: string) => void;
    executeBatchOperation: (operation: 'complete' | 'delete' | 'promote') => Promise<void>;
    isProcessing: boolean;
}

export function useBatchTaskOperations(
    tasks: Task[],
    updateTask: (task: Task) => Promise<void>,
    deleteTask: (id: string) => Promise<void>
): UseBatchTaskOperationsResult {
    const [batchMode, setBatchMode] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleBatchMode = useCallback(() => {
        setBatchMode(prev => !prev);
        if (batchMode) {
            setSelectedTasks(new Set());
        }
    }, [batchMode]);

    const selectAll = useCallback(() => {
        setSelectedTasks(new Set(tasks.map(t => t.id)));
    }, [tasks]);

    const selectNone = useCallback(() => {
        setSelectedTasks(new Set());
    }, []);

    const toggleTaskSelection = useCallback((taskId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    }, []);

    const executeBatchOperation = useCallback(async (operation: 'complete' | 'delete' | 'promote') => {
        if (selectedTasks.size === 0) return;

        setIsProcessing(true);
        try {
            const selectedTaskObjects = tasks.filter(t => selectedTasks.has(t.id));

            switch (operation) {
                case 'complete':
                    for (const task of selectedTaskObjects) {
                        if (task.status !== 'done') {
                            await updateTask({ ...task, status: 'done' });
                        }
                    }
                    break;
                
                case 'delete':
                    for (const task of selectedTaskObjects) {
                        await deleteTask(task.id);
                    }
                    break;
                
                case 'promote':
                    // This would need additional logic for promotion destinations
                    console.log('Batch promotion not yet implemented');
                    break;
            }

            setSelectedTasks(new Set());
        } catch (error) {
            console.error(`Failed to execute batch ${operation}:`, error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [selectedTasks, tasks, updateTask, deleteTask]);

    return {
        batchMode,
        selectedTasks,
        toggleBatchMode,
        selectAll,
        selectNone,
        toggleTaskSelection,
        executeBatchOperation,
        isProcessing,
    };
} 