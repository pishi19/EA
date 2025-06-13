// Document service for system documentation functionality
export interface DocFile {
    filename: string;
    friendlyName: string;
    size: number;
    modified: string;
    title: string;
    tags: string[];
}

export interface SelectedFile extends DocFile {
    metadata: any;
    content: string;
    rawContent: string;
}

export interface SystemDocsResponse {
    fileList: DocFile[];
    selectedFile: SelectedFile | null;
}

export interface SaveDocumentRequest {
    filename: string;
    content: string;
    lastModified?: string; // For conflict detection
}

export interface SaveDocumentResponse {
    success: boolean;
    message?: string;
    file?: SelectedFile;
    conflict?: boolean;
}

class DocService {
    private baseUrl = '/api/system-docs';

    /**
     * Fetch all available documents
     */
    async fetchDocumentList(): Promise<SystemDocsResponse> {
        try {
            const response = await fetch(this.baseUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Document service - fetch list error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch document list');
        }
    }

    /**
     * Fetch specific document content
     */
    async fetchDocument(filename: string): Promise<SystemDocsResponse> {
        try {
            const response = await fetch(`${this.baseUrl}?file=${encodeURIComponent(filename)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Document service - fetch document error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch document content');
        }
    }

    /**
     * Save document content
     */
    async saveDocument(request: SaveDocumentRequest): Promise<SaveDocumentResponse> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Save failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Document service - save error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to save document');
        }
    }

    /**
     * Create new document
     */
    async createDocument(filename: string, content: string = ''): Promise<SaveDocumentResponse> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename, content }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Create failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Document service - create error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to create document');
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(filename: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}?file=${encodeURIComponent(filename)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Delete failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Document service - delete error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
        }
    }

    /**
     * Download document as file
     */
    downloadDocument(file: DocFile, content: string): void {
        try {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Document service - download error:', error);
            throw new Error('Failed to download document');
        }
    }

    /**
     * Search documents by query
     */
    async searchDocuments(query: string): Promise<DocFile[]> {
        try {
            const response = await this.fetchDocumentList();
            const lowercaseQuery = query.toLowerCase();
            
            return response.fileList.filter(file =>
                file.title.toLowerCase().includes(lowercaseQuery) ||
                file.friendlyName.toLowerCase().includes(lowercaseQuery) ||
                file.filename.toLowerCase().includes(lowercaseQuery) ||
                file.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
            );
        } catch (error) {
            console.error('Document service - search error:', error);
            throw new Error('Failed to search documents');
        }
    }

    /**
     * Preview markdown content (convert to HTML)
     */
    async previewMarkdown(content: string): Promise<string> {
        try {
            const response = await fetch('/api/markdown-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error('Preview generation failed');
            }

            const data = await response.json();
            return data.html;
        } catch (error) {
            console.error('Document service - preview error:', error);
            // Fallback to basic markdown rendering
            return content.replace(/\n/g, '<br>');
        }
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Format date for display
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Export singleton instance
export const docService = new DocService(); 