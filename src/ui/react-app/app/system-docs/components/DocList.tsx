import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { DocFile } from '../services/docService';

interface DocListProps {
    documents: DocFile[];
    selectedFileName: string;
    onSelectDocument: (filename: string) => void;
    formatFileSize: (bytes: number) => string;
    formatDate: (dateString: string) => string;
    className?: string;
}

export default function DocList({
    documents,
    selectedFileName,
    onSelectDocument,
    formatFileSize,
    formatDate,
    className = "",
}: DocListProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    📁 All Documents
                </CardTitle>
                <CardDescription>
                    {documents.length} {documents.length === 1 ? 'document' : 'documents'} • Click to select
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {documents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No documents found</p>
                    </div>
                ) : (
                    documents.map((file) => (
                        <div
                            key={file.filename}
                            data-filename={file.filename}
                            className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ${
                                selectedFileName === file.filename
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                            onClick={() => onSelectDocument(file.filename)}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <p className="font-medium text-sm truncate">{file.friendlyName}</p>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2">
                                {formatFileSize(file.size)} • {formatDate(file.modified)}
                            </p>
                            
                            {file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {file.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge 
                                            key={idx} 
                                            variant="outline" 
                                            className="text-xs px-2 py-0"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                    {file.tags.length > 3 && (
                                        <Badge 
                                            variant="outline" 
                                            className="text-xs px-2 py-0 text-muted-foreground"
                                        >
                                            +{file.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
