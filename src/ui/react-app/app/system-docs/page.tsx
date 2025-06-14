"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import RoadmapPanel from './components/RoadmapPanel';
import DocFilterControls from './components/DocFilterControls';
import DocList from './components/DocList';
import DocHeader from './components/DocHeader';
import DocContent from './components/DocContent';
import DocEditor from './components/DocEditor';
import EditControls from './components/EditControls';
import CreateDocumentDialog from './components/CreateDocumentDialog';
import { useDocs } from './hooks/useDocs';
import { useDocFilters } from './hooks/useDocFilters';

// Main page component
export default function SystemDocsPage() {
    // Custom hooks for data management
    const {
        documents,
        selectedDocument,
        loading,
        error,
        totalCount,
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
    } = useDocs();

    // Filtering capabilities
    const {
        filters,
        filterOptions,
        filteredDocuments,
        setSearch,
        setTagFilter,
        setSortBy,
        setSortOrder,
        clearFilters,
        activeFilterCount,
    } = useDocFilters(documents);

    // Handle document download
    const handleDownload = () => {
        if (selectedDocument) {
            const content = isEditing ? editContent : selectedDocument.rawContent;
            downloadDocument(selectedDocument, content);
        }
    };

    // Handle document edit
    const handleEdit = () => {
        startEditing();
    };

    // Handle document delete
    const handleDelete = () => {
        if (selectedDocument) {
            deleteDocument(selectedDocument.filename);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">Loading system documentation...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Error: {error}</span>
                        </div>
                        <button 
                            onClick={refreshDocuments}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* System Roadmap Panel */}
            <RoadmapPanel />

            {/* Filter Controls with Create Button */}
            <div className="mb-6 flex items-start gap-4">
                <div className="flex-1">
                    <DocFilterControls
                        filters={filters}
                        filterOptions={filterOptions}
                        onSearchChange={setSearch}
                        onTagFilterChange={setTagFilter}
                        onSortByChange={setSortBy}
                        onSortOrderChange={setSortOrder}
                        onClearFilters={clearFilters}
                        totalCount={totalCount}
                        filteredCount={filteredDocuments.length}
                        activeFilterCount={activeFilterCount}
                    />
                </div>
                <div className="flex-shrink-0 pt-10">
                    <CreateDocumentDialog 
                        onCreateDocument={createDocument}
                        trigger={
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                New Document
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Document List Sidebar */}
                <div className="lg:col-span-1">
                    <DocList
                        documents={filteredDocuments}
                        selectedFileName={selectedFileName}
                        onSelectDocument={selectDocument}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                    />
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <Card>
                        {selectedDocument ? (
                            <>
                                <CardHeader>
                                    <DocHeader
                                        document={selectedDocument}
                                        isEditing={isEditing}
                                        onDownload={handleDownload}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        formatFileSize={formatFileSize}
                                        formatDate={formatDate}
                                    />
                                </CardHeader>
                                
                                {/* Content or Editor */}
                                {isEditing ? (
                                    <div className="flex flex-col">
                                        <DocEditor
                                            content={editContent}
                                            onChange={updateEditContent}
                                            onPreview={previewContent}
                                        />
                                        <EditControls
                                            hasUnsavedChanges={hasUnsavedChanges}
                                            autoSaveStatus={autoSaveStatus}
                                            onSave={saveDocument}
                                            onCancel={cancelEditing}
                                        />
                                    </div>
                                ) : (
                                    <DocContent document={selectedDocument} />
                                )}
                            </>
                        ) : (
                            <DocContent document={null} />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
