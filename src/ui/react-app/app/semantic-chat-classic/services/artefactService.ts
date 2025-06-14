// Artefact service for semantic chat functionality
export interface Artefact {
    id: string;
    name: string;
    title?: string;
    phase?: string;
    workstream?: string;
    status?: string;
    score?: number;
    tags?: string[];
    created?: string;
    summary?: string;
    filePath?: string;
}

export interface ArtefactResponse {
    artefacts: Artefact[];
    total: number;
    workstream: string;
}

class ArtefactService {
    private baseUrl = '/api';

    /**
     * Fetch artefacts for a specific workstream
     */
    async fetchArtefacts(workstream: string): Promise<ArtefactResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/demo-loops?workstream=${workstream}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch artefacts: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                artefacts: data.artefacts || [],
                total: data.artefacts?.length || 0,
                workstream: workstream
            };
        } catch (error) {
            console.error('ArtefactService.fetchArtefacts error:', error);
            throw error;
        }
    }

    /**
     * Get artefact by ID
     */
    async getArtefactById(id: string, workstream: string): Promise<Artefact | null> {
        try {
            const response = await this.fetchArtefacts(workstream);
            return response.artefacts.find(artefact => artefact.id === id) || null;
        } catch (error) {
            console.error('ArtefactService.getArtefactById error:', error);
            throw error;
        }
    }

    /**
     * Search artefacts by query
     */
    async searchArtefacts(query: string, workstream: string): Promise<Artefact[]> {
        try {
            const response = await this.fetchArtefacts(workstream);
            const searchTerm = query.toLowerCase();
            
            return response.artefacts.filter(artefact => {
                const searchableText = [
                    artefact.title,
                    artefact.name,
                    artefact.summary,
                    ...(artefact.tags || [])
                ].join(' ').toLowerCase();
                
                return searchableText.includes(searchTerm);
            });
        } catch (error) {
            console.error('ArtefactService.searchArtefacts error:', error);
            throw error;
        }
    }

    /**
     * Get unique values for filtering
     */
    async getFilterOptions(workstream: string) {
        try {
            const response = await this.fetchArtefacts(workstream);
            const artefacts = response.artefacts;
            
            return {
                phases: [...new Set(artefacts.map(a => a.phase).filter(Boolean))].sort(),
                statuses: [...new Set(artefacts.map(a => a.status).filter(Boolean))].sort(),
                workstreams: [...new Set(artefacts.map(a => a.workstream).filter(Boolean))].sort(),
                tags: [...new Set(artefacts.flatMap(a => a.tags || []))].sort()
            };
        } catch (error) {
            console.error('ArtefactService.getFilterOptions error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const artefactService = new ArtefactService();
export default artefactService; 