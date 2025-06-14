export interface ArtefactApiResponse {
    artefacts: any[];
}

class ArtefactService {
    async getArtefacts(workstream: string): Promise<any[]> {
        console.log('ArtefactService.getArtefacts called with workstream:', workstream);
        
        const url = `/api/demo-loops?workstream=${workstream}`;
        console.log('Fetching from URL:', url);
        
        try {
            const response = await fetch(url);
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Failed to load artefacts: ${response.status}`);
            }
            
            const data: ArtefactApiResponse = await response.json();
            console.log('API response data:', data);
            console.log('Artefacts array:', data.artefacts);
            console.log('Artefacts count:', data.artefacts?.length || 0);
            
            return data.artefacts || [];
        } catch (error) {
            console.error('ArtefactService.getArtefacts error:', error);
            throw error;
        }
    }

    async createArtefact(artefactData: any): Promise<any> {
        const response = await fetch('/api/task-mutations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add',
                taskData: artefactData
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create artefact: ${response.status}`);
        }

        return response.json();
    }

    async updateArtefact(artefactId: string, artefactData: any): Promise<any> {
        const response = await fetch('/api/task-mutations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'edit',
                taskId: artefactId,
                taskData: artefactData
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update artefact: ${response.status}`);
        }

        return response.json();
    }

    async deleteArtefact(artefactId: string): Promise<void> {
        const response = await fetch('/api/task-mutations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                taskId: artefactId
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete artefact: ${response.status}`);
        }
    }

    async batchOperation(operation: 'add' | 'edit' | 'delete', artefacts: any[]): Promise<any> {
        const response = await fetch('/api/task-mutations/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                operations: artefacts.map(artefact => ({
                    action: operation,
                    taskId: artefact.id,
                    taskData: artefact
                }))
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to perform batch ${operation}: ${response.status}`);
        }

        return response.json();
    }
}

export const artefactService = new ArtefactService(); 