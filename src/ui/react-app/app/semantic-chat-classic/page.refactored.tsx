"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import RoadmapPanel from './components/RoadmapPanel';
import EnhancedLoopCard from './components/EnhancedLoopCard';
import { useArtefacts } from './hooks/useArtefacts';
import { useArtefactFilters } from './hooks/useArtefactFilters';

// Main page component
export default function SemanticChatClassic() {
    // Custom hooks for data management
    const {
        artefacts,
        loading,
        error,
        totalCount,
        currentWorkstream,
        refreshArtefacts
    } = useArtefacts();

    // Filtering capabilities (for future enhancement)
    const {
        filteredArtefacts,
        activeFilterCount,
        isFiltered
    } = useArtefactFilters(artefacts);

    // Use filtered artefacts if any filters are active, otherwise use all artefacts
    const displayArtefacts = isFiltered ? filteredArtefacts : artefacts;

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">🤖 Semantic Chat</h1>
                    <p className="text-muted-foreground">Loading artefacts with embedded contextual chat...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">🤖 Semantic Chat</h1>
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <Button onClick={refreshArtefacts} className="bg-blue-500 hover:bg-blue-600">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Roadmap Panel */}
            <RoadmapPanel />

            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">🤖 Semantic Chat</h1>
                <p className="text-lg text-muted-foreground">
                    Scoped GPT Chat Integration - Each Loop with Embedded Contextual Chat
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>{displayArtefacts.length} artefacts displayed</span>
                    <span>•</span>
                    <span>Total: {totalCount}</span>
                    <span>•</span>
                    <span>Workstream: {currentWorkstream}</span>
                    {isFiltered && (
                        <>
                            <span>•</span>
                            <span className="text-blue-600">{activeFilterCount} filter(s) active</span>
                        </>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Chat scoped by UUID and file path • Persistent conversation history
                </p>
            </div>

            {/* Artefact Cards with Embedded Chat */}
            <div className="space-y-6">
                {displayArtefacts.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">
                            {isFiltered ? 'No artefacts match the current filters.' : 'No artefacts available.'}
                        </p>
                        {isFiltered && (
                            <Button 
                                onClick={() => window.location.reload()} 
                                variant="outline" 
                                className="mt-4"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    displayArtefacts.map((artefact) => (
                        <EnhancedLoopCard 
                            key={artefact.id} 
                            artefact={artefact}
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
                {isFiltered && (
                    <p className="text-xs text-blue-600 mt-2">
                        ℹ️ Filtering is active - showing {displayArtefacts.length} of {totalCount} total artefacts
                    </p>
                )}
            </div>
        </div>
    );
} 