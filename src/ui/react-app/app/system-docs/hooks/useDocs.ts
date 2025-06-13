import { useState, useEffect, useCallback } from 'react';
import { docService, DocFile, SelectedFile, SystemDocsResponse, SaveDocumentRequest } from '../services/docService';

export interface UseDocsResult {
    documents: DocFile[];
    selectedDocument: SelectedFile | null;
    loading: boolean;
    error: string | null;
    totalCount: number;
    selectedFileName: string;
    isEditing: boolean;
    editContent: string;
    hasUnsavedChanges: boolean;
    autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
    selectDocument: (filename: string) => Promise<void>;
    refreshDocuments: () => Promise<void>;
    downloadDocument: (file: DocFile, content: string) => void;
    formatFileSize: (bytes: number) => string;
    formatDate: (dateString: string) => string;
    // Editing operations
    startEditing: () => void;
    cancelEditing: () => void;
    updateEditContent: (content: string) => void;
    saveDocument: () => Promise<void>;
    createDocument: (filename: string, content?: string) => Promise<void>;
    deleteDocument: (filename: string) => Promise<void>;
    previewContent: (content: string) => Promise<string>;
}

export function useDocs(): UseDocsResult {
    const [documents, setDocuments] = useState<DocFile[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<SelectedFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState<string>('');
    const [originalContent, setOriginalContent] = useState<string>('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Fetch document list
    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await docService.fetchDocumentList();
            setDocuments(response.fileList);
            
            // Auto-select the first document if none selected
            if (response.fileList.length > 0 && !selectedFileName) {
                const firstDoc = response.fileList[0];
                setSelectedFileName(firstDoc.filename);
                // Fetch content for first document
                await selectDocumentContent(firstDoc.filename);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
            console.error('useDocs - fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedFileName]);

    // Fetch specific document content
    const selectDocumentContent = useCallback(async (filename: string) => {
        try {
            setError(null);
            
            const response = await docService.fetchDocument(filename);
            setSelectedDocument(response.selectedFile);
            setDocuments(response.fileList); // Update list in case of changes
            
            // Reset editing state when selecting a new document
            if (response.selectedFile) {
                setOriginalContent(response.selectedFile.rawContent);
                setEditContent(response.selectedFile.rawContent);
                setIsEditing(false);
                setHasUnsavedChanges(false);
                setAutoSaveStatus('idle');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch document content');
            console.error('useDocs - select document error:', err);
        }
    }, []);

    // Select document handler
    const selectDocument = useCallback(async (filename: string) => {
        if (filename === selectedFileName) return;
        
        // Check for unsaved changes
        if (hasUnsavedChanges) {
            const confirm = window.confirm('You have unsaved changes. Do you want to discard them?');
            if (!confirm) return;
        }
        
        setSelectedFileName(filename);
        await selectDocumentContent(filename);
    }, [selectedFileName, hasUnsavedChanges, selectDocumentContent]);

    // Start editing
    const startEditing = useCallback(() => {
        if (selectedDocument) {
            setIsEditing(true);
            setEditContent(selectedDocument.rawContent);
            setOriginalContent(selectedDocument.rawContent);
            setHasUnsavedChanges(false);
            setAutoSaveStatus('idle');
        }
    }, [selectedDocument]);

    // Cancel editing
    const cancelEditing = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirm = window.confirm('You have unsaved changes. Do you want to discard them?');
            if (!confirm) return;
        }
        
        setIsEditing(false);
        setEditContent(originalContent);
        setHasUnsavedChanges(false);
        setAutoSaveStatus('idle');
    }, [hasUnsavedChanges, originalContent]);

    // Update edit content
    const updateEditContent = useCallback((content: string) => {
        setEditContent(content);
        setHasUnsavedChanges(content !== originalContent);
        setAutoSaveStatus('idle');
    }, [originalContent]);

    // Save document
    const saveDocument = useCallback(async () => {
        if (!selectedDocument || !hasUnsavedChanges) return;
        
        try {
            setAutoSaveStatus('saving');
            setError(null);
            
            const request: SaveDocumentRequest = {
                filename: selectedDocument.filename,
                content: editContent,
                lastModified: selectedDocument.modified,
            };
            
            const response = await docService.saveDocument(request);
            
            if (response.success && response.file) {
                setSelectedDocument(response.file);
                setOriginalContent(editContent);
                setHasUnsavedChanges(false);
                setAutoSaveStatus('saved');
                
                // Refresh document list to update metadata
                await fetchDocuments();
                
                // Auto-clear saved status after 3 seconds
                setTimeout(() => setAutoSaveStatus('idle'), 3000);
            } else {
                throw new Error(response.message || 'Save failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save document');
            setAutoSaveStatus('error');
            console.error('useDocs - save error:', err);
        }
    }, [selectedDocument, hasUnsavedChanges, editContent, fetchDocuments]);

    // Create document
    const createDocument = useCallback(async (filename: string, content: string = '') => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await docService.createDocument(filename, content);
            
            if (response.success) {
                await fetchDocuments();
                // Select the newly created document
                setSelectedFileName(filename);
                await selectDocumentContent(filename);
            } else {
                throw new Error(response.message || 'Create failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create document');
            console.error('useDocs - create error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchDocuments, selectDocumentContent]);

    // Delete document
    const deleteDocument = useCallback(async (filename: string) => {
        const confirm = window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`);
        if (!confirm) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const response = await docService.deleteDocument(filename);
            
            if (response.success) {
                await fetchDocuments();
                // If we deleted the selected document, clear selection
                if (selectedFileName === filename) {
                    setSelectedFileName('');
                    setSelectedDocument(null);
                    setIsEditing(false);
                    setEditContent('');
                    setHasUnsavedChanges(false);
                }
            } else {
                throw new Error(response.message || 'Delete failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document');
            console.error('useDocs - delete error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchDocuments, selectedFileName]);

    // Preview content
    const previewContent = useCallback(async (content: string): Promise<string> => {
        try {
            return await docService.previewMarkdown(content);
        } catch (err) {
            console.error('useDocs - preview error:', err);
            throw new Error('Failed to generate preview');
        }
    }, []);

    // Refresh documents
    const refreshDocuments = useCallback(async () => {
        await fetchDocuments();
    }, [fetchDocuments]);

    // Download document
    const downloadDocument = useCallback((file: DocFile, content: string) => {
        try {
            docService.downloadDocument(file, content);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download document');
            console.error('useDocs - download error:', err);
        }
    }, []);

    // Format helpers
    const formatFileSize = useCallback((bytes: number) => {
        return docService.formatFileSize(bytes);
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return docService.formatDate(dateString);
    }, []);

    // Auto-save functionality (optional - can be enabled/disabled)
    useEffect(() => {
        if (!hasUnsavedChanges || !isEditing) return;
        
        const autoSaveTimer = setTimeout(() => {
            if (hasUnsavedChanges && editContent.length > 0) {
                saveDocument();
            }
        }, 10000); // Auto-save after 10 seconds of inactivity
        
        return () => clearTimeout(autoSaveTimer);
    }, [editContent, hasUnsavedChanges, isEditing, saveDocument]);

    // Initial load
    useEffect(() => {
        fetchDocuments();
    }, []);

    return {
        documents,
        selectedDocument,
        loading,
        error,
        totalCount: documents.length,
        selectedFileName,
        isEditing,
        editContent,
        hasUnsavedChanges,
        autoSaveStatus,
        selectDocument,
        refreshDocuments,
        downloadDocument,
        formatFileSize,
        formatDate,
        // Editing operations
        startEditing,
        cancelEditing,
        updateEditContent,
        saveDocument,
        createDocument,
        deleteDocument,
        previewContent,
    };
} 