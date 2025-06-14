import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag } from 'lucide-react';
import { Artefact } from '../services/artefactService';

interface LoopMetadataProps {
    artefact: Artefact;
    className?: string;
}

export default function LoopMetadata({ artefact, className = "" }: LoopMetadataProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Summary */}
            {artefact.summary && (
                <p className="text-sm text-muted-foreground">{artefact.summary}</p>
            )}
            
            {/* Tags */}
            {artefact.tags && artefact.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {artefact.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Creation Date */}
            {artefact.created && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(artefact.created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                    })}
                </div>
            )}
        </div>
    );
} 