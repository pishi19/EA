import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface EditControlsProps {
    hasUnsavedChanges: boolean;
    autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onSave: () => void;
    onCancel: () => void;
    className?: string;
}

export default function EditControls({
    hasUnsavedChanges,
    autoSaveStatus,
    onSave,
    onCancel,
    className = "",
}: EditControlsProps) {
    // Auto-save status indicator
    const getStatusIndicator = () => {
        switch (autoSaveStatus) {
            case 'saving':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Saving...
                    </Badge>
                );
            case 'saved':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1 text-green-700 bg-green-100">
                        <CheckCircle className="h-3 w-3" />
                        Saved
                    </Badge>
                );
            case 'error':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1 text-red-700 bg-red-100">
                        <AlertTriangle className="h-3 w-3" />
                        Error
                    </Badge>
                );
            default:
                return hasUnsavedChanges ? (
                    <Badge variant="secondary" className="flex items-center gap-1 text-orange-700 bg-orange-100">
                        <Clock className="h-3 w-3" />
                        Unsaved changes
                    </Badge>
                ) : null;
        }
    };

    return (
        <div className={`flex items-center justify-between p-4 border-t bg-gray-50 ${className}`}>
            <div className="flex items-center gap-3">
                {getStatusIndicator()}
                
                {hasUnsavedChanges && (
                    <span className="text-sm text-gray-600">
                        Auto-save in 10 seconds
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="flex items-center gap-2"
                >
                    <X className="h-4 w-4" />
                    Cancel
                </Button>
                
                <Button
                    onClick={onSave}
                    disabled={!hasUnsavedChanges || autoSaveStatus === 'saving'}
                    size="sm"
                    className="flex items-center gap-2"
                >
                    {autoSaveStatus === 'saving' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save Document
                </Button>
            </div>
        </div>
    );
}
