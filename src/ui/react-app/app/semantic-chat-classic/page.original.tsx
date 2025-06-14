"use client";

import React, { useState, useEffect } from 'react';
import LoopCard from '@/components/LoopCard';
import { useWorkstream } from '@/lib/workstream-context';

// --- Types ---
interface Loop {
    id: string;
    name: string;
    title?: string;
    phase?: string;
    workstream?: string;
    status?: string;
    score?: number;
    tags?: string[];
    created?: string;
    summary?: string;
    filePath?: string;
}

// --- Component ---
export default function SemanticChatClassic() {
    const [loops, setLoops] = useState<Loop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Use workstream context instead of local state
    const { currentWorkstream, isValidWorkstream } = useWorkstream();

    // Load loops from API
    const loadLoops = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use current workstream from context, fallback to 'ora' if not valid
            const workstream = (currentWorkstream && isValidWorkstream(currentWorkstream)) 
                ? currentWorkstream 
                : 'ora';
            
            const response = await fetch(`/api/demo-loops?workstream=${workstream}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load loops: ${response.status}`);
            }
            
            const response_data = await response.json();
            setLoops(response_data.artefacts || []);
            
        } catch (err) {
            console.error('Error loading loops:', err);
            setError(err instanceof Error ? err.message : 'Failed to load loops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLoops();
    }, [currentWorkstream]); // Re-load when workstream changes

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Artefacts</h1>
                    <p className="text-muted-foreground">Loading loops with embedded contextual chat...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Artefacts</h1>
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <button 
                        onClick={loadLoops} 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Artefacts</h1>
                <p className="text-lg text-muted-foreground">
                    Scoped GPT Chat Integration - Each Loop with Embedded Contextual Chat
                </p>
                <p className="text-sm text-muted-foreground">
                    {loops.length} loops loaded • Chat scoped by UUID and file path • Persistent conversation history
                </p>
            </div>

            {/* Loop Cards with Embedded Chat */}
            <div className="space-y-6">
                {loops.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No loops available.</p>
                    </div>
                ) : (
                    loops.map((loop) => (
                        <LoopCard 
                            key={loop.id} 
                            loop={loop}
                        />
                    ))
                )}
            </div>

            {/* Footer Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border text-center">
                <p className="text-sm text-gray-600">
                    🔄 <strong>Contextual Chat Architecture</strong> - Each chat interaction is tied to its semantic context and becomes part of the execution history
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Expand any chat section to interact with that specific loop context • Messages persist to loop files under ## 💬 Chat sections
                </p>
            </div>
        </div>
    );
} 