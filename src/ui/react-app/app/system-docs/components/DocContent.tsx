import React from 'react';
import { CardContent } from '@/components/ui/card';
import { SelectedFile } from '../services/docService';

interface DocContentProps {
    document: SelectedFile | null;
    loading?: boolean;
    className?: string;
}

export default function DocContent({ document, loading = false, className = "" }: DocContentProps) {
    if (loading) {
        return (
            <CardContent className={`p-6 ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading document content...</p>
                </div>
            </CardContent>
        );
    }

    if (!document) {
        return (
            <CardContent className={`p-6 text-center text-muted-foreground ${className}`}>
                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-gray-100 p-4">
                        <svg 
                            className="h-12 w-12 text-gray-400" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                        <p className="text-sm">Select a document from the list to view its content</p>
                    </div>
                </div>
            </CardContent>
        );
    }

    return (
        <CardContent className={`p-6 ${className}`}>
            {/* Rendered Markdown Content */}
            <div 
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4"
                dangerouslySetInnerHTML={{ __html: document.content }}
            />
        </CardContent>
    );
}
