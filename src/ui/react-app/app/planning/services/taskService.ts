// Task Service Layer
export interface Task {
    id: string;
    description: string;
    added_by: 'user' | 'ora';
    status: 'pending' | 'done' | 'rejected' | 'promoted';
    source: string;
    context?: string;
    section: 'User-Defined Tasks' | 'Ora-Suggested Tasks';
    promoted_to?: string;
}

export interface Loop {
    id: string;
    name: string;
}

export interface ProjectTaskFile {
    id: string;
    name: string;
}

export interface CreateTaskRequest {
    description: string;
    added_by: 'user' | 'ora';
    context?: string;
}

export interface PromoteTaskRequest {
    task: Task;
    destinationType: 'new-loop' | 'existing-loop' | 'project-task-file';
    destinationId: string;
}

class TaskService {
    async getTasks(): Promise<Task[]> {
        const res = await fetch('/api/plan-tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
    }

    async createTask(task: CreateTaskRequest): Promise<Task> {
        const res = await fetch('/api/plan-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to add task');
        return res.json();
    }

    async updateTask(task: Task): Promise<Task> {
        const res = await fetch('/api/plan-tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to update task');
        return res.json();
    }

    async deleteTask(id: string): Promise<void> {
        const res = await fetch('/api/plan-tasks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error('Failed to delete task');
    }

    async getLoops(): Promise<Loop[]> {
        const res = await fetch('/api/loops');
        if (!res.ok) throw new Error('Failed to fetch loops');
        return res.json();
    }

    async getProjectTaskFiles(): Promise<ProjectTaskFile[]> {
        const res = await fetch('/api/project-task-files');
        if (!res.ok) throw new Error('Failed to fetch project task files');
        return res.json();
    }

    async promoteTask(promotionDetails: PromoteTaskRequest): Promise<void> {
        const res = await fetch('/api/promote-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promotionDetails)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to promote task');
        }
    }

    async chatWithTask(message: string, taskContext: any, conversationHistory: any[]): Promise<{ content: string }> {
        const response = await fetch('/api/task-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                context: taskContext,
                conversationHistory
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get chat response');
        }

        return response.json();
    }
}

export const taskService = new TaskService(); 