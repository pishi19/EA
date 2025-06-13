import React from 'react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar, HardDrive, Edit, Trash2 } from 'lucide-react';
import { SelectedFile } from '../services/docService';

interface DocHeaderProps {
    document: SelectedFile;
    isEditing: boolean;
    onDownload: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatFileSize: (bytes: number) => string;
    formatDate: (dateString: string) => string;
}

export default function DocHeader({
    document,
    isEditing,
    onDownload,
    onEdit,
    onDelete,
    formatFileSize,
    formatDate,
}: DocHeaderProps) {
    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate flex items-center gap-2">
                        {document.title}
                        {isEditing && (
                            <Badge variant="secondary" className="text-xs">
                                Editing
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {document.filename}
                    </CardDescription>
                </div>
                
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {!isEditing && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onEdit}
                                className="flex items-center gap-2"
                                title="Edit document"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDownload}
                                className="flex items-center gap-2"
                                title="Download document"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDelete}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete document"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>
            
            {/* File Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HardDrive className="h-4 w-4 flex-shrink-0" />
                    <span>{formatFileSize(document.size)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(document.modified)}</span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    {document.tags.length > 0 ? (
                        document.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                </div>
            </div>
        </div>
    );
}
