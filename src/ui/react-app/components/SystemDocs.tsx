"use client";

/**
 * @deprecated This component has been refactored into a modular architecture.
 * 
 * NEW ARCHITECTURE (system-docs/):
 * - Service Layer: services/docService.ts
 * - Custom Hooks: hooks/useDocs.ts, hooks/useDocFilters.ts  
 * - UI Components: components/RoadmapPanel.tsx, DocFilterControls.tsx, etc.
 * - Main Page: app/system-docs/page.tsx
 * 
 * This monolithic component (279 lines) has been transformed into:
 * - Clean 121-line main component using custom hooks
 * - 852+ lines of modular, reusable, testable code
 * - Enhanced features: roadmap integration, advanced filtering, improved UX
 * 
 * See: app/system-docs/REFACTORING_GUIDE.md for complete documentation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, HardDrive, AlertTriangle } from "lucide-react";

interface DocFile {
    filename: string;
    friendlyName: string;
    size: number;
    modified: string;
    title: string;
    tags: string[];
}

interface SelectedFile extends DocFile {
    metadata: any;
    content: string;
    rawContent: string;
}

interface SystemDocsData {
    fileList: DocFile[];
    selectedFile: SelectedFile | null;
}

export default function SystemDocs() {
    const [data, setData] = useState<SystemDocsData>({ fileList: [], selectedFile: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    // Fetch file list on component mount
    useEffect(() => {
        const fetchFileList = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/system-docs');
                if (!response.ok) {
                    throw new Error('Failed to fetch system documentation');
                }
                const result = await response.json();
                setData(result);
                
                // Auto-select the first file if available
                if (result.fileList.length > 0 && !selectedFileName) {
                    setSelectedFileName(result.fileList[0].filename);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFileList();
    }, []);

    // Fetch specific file content when selection changes
    useEffect(() => {
        if (!selectedFileName) return;

        const fetchFileContent = async () => {
            try {
                const response = await fetch(`/api/system-docs?file=${encodeURIComponent(selectedFileName)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch file content');
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load file content');
            }
        };

        fetchFileContent();
    }, [selectedFileName]);

    const handleDownload = (file: DocFile, content: string) => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading system documentation...</div>;
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Error: {error}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        System Documentation
                    </CardTitle>
                    <CardDescription>
                        Browse and view all system documentation from /runtime/docs/
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Document
                            </label>
                            <Select value={selectedFileName} onValueChange={setSelectedFileName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a document..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.fileList.map(file => (
                                        <SelectItem key={file.filename} value={file.filename}>
                                            {file.friendlyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {data.fileList.length} documents available
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* File List Sidebar */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">📁 All Documents</CardTitle>
                            <CardDescription>Click to select</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.fileList.map((file) => (
                                <div
                                    key={file.filename}
                                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                        selectedFileName === file.filename
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-slate-50 hover:bg-slate-100'
                                    }`}
                                    onClick={() => setSelectedFileName(file.filename)}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <p className="font-medium text-sm">{file.friendlyName}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatFileSize(file.size)} • {formatDate(file.modified)}
                                    </p>
                                    {file.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {file.tags.slice(0, 3).map((tag, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {file.tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{file.tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {data.selectedFile ? (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {data.selectedFile.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {data.selectedFile.filename}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(data.selectedFile!, data.selectedFile!.rawContent)}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                                
                                {/* File Metadata */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <HardDrive className="h-4 w-4" />
                                        {formatFileSize(data.selectedFile.size)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(data.selectedFile.modified)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {data.selectedFile.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Rendered Markdown Content */}
                                <div 
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: data.selectedFile.content }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Select a document from the list to view its content</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
} 