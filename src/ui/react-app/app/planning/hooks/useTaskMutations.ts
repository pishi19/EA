import { useState } from 'react';
import { taskService, Task, CreateTaskRequest, PromoteTaskRequest } from '../services/taskService';

export interface UseTaskMutationsResult {
    createTask: (taskData: CreateTaskRequest) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    promoteTask: (promotionData: PromoteTaskRequest) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export function useTaskMutations(onMutationSuccess?: () => void): UseTaskMutationsResult {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createTask = async (taskData: CreateTaskRequest) => {
        try {
            setLoading(true);
            setError(null);
            await taskService.createTask(taskData);
            onMutationSuccess?.();
        } catch (err) {
            console.error('Failed to create task:', err);
            setError(err instanceof Error ? err.message : 'Failed to create task');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateTask = async (task: Task) => {
        try {
            setLoading(true);
            setError(null);
            await taskService.updateTask(task);
            onMutationSuccess?.();
        } catch (err) {
            console.error('Failed to update task:', err);
            setError(err instanceof Error ? err.message : 'Failed to update task');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await taskService.deleteTask(id);
            onMutationSuccess?.();
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete task');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const promoteTask = async (promotionData: PromoteTaskRequest) => {
        try {
            setLoading(true);
            setError(null);
            await taskService.promoteTask(promotionData);
            onMutationSuccess?.();
        } catch (err) {
            console.error('Failed to promote task:', err);
            setError(err instanceof Error ? err.message : 'Failed to promote task');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createTask,
        updateTask,
        deleteTask,
        promoteTask,
        loading,
        error,
    };
} 