import React from 'react';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Artefact } from '../services/artefactService';

interface LoopHeaderProps {
    artefact: Artefact;
}

// Helper functions for styling
const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
        case 'planning': return 'bg-blue-100 text-blue-800';
        case 'active': return 'bg-green-100 text-green-800';
        case 'completed': return 'bg-gray-100 text-gray-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getScoreColor = (score?: number): string => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
};

export default function LoopHeader({ artefact }: LoopHeaderProps) {
    return (
        <div className="flex items-start justify-between">
            <div className="space-y-2">
                <CardTitle className="text-lg font-semibold">
                    {artefact.title || artefact.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                        {artefact.id}
                    </Badge>
                    {artefact.phase && (
                        <Badge variant="secondary" className="text-xs">
                            Phase {artefact.phase}
                        </Badge>
                    )}
                    {artefact.workstream && (
                        <Badge variant="outline" className="text-xs">
                            {artefact.workstream}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                {artefact.status && (
                    <Badge className={`text-xs ${getStatusColor(artefact.status)}`}>
                        {artefact.status}
                    </Badge>
                )}
                {artefact.score && (
                    <div className={`text-sm font-medium ${getScoreColor(artefact.score)}`}>
                        Score: {artefact.score.toFixed(2)}
                    </div>
                )}
            </div>
        </div>
    );
} 