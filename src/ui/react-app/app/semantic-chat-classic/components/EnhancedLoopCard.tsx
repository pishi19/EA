import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LoopHeader from './LoopHeader';
import LoopMetadata from './LoopMetadata';
import LoopChat from './LoopChat';
import { Artefact } from '../services/artefactService';

interface EnhancedLoopCardProps {
    artefact: Artefact;
    className?: string;
}

export default function EnhancedLoopCard({ artefact, className = "" }: EnhancedLoopCardProps) {
    return (
        <Card className={`w-full ${className}`}>
            <CardHeader>
                <LoopHeader artefact={artefact} />
            </CardHeader>
            
            <CardContent className="space-y-4">
                <LoopMetadata artefact={artefact} />
                <LoopChat artefact={artefact} />
            </CardContent>
        </Card>
    );
} 