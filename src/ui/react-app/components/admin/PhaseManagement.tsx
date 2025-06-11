"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhaseInfo {
    id: string;
    number: string;
    title: string;
    fullTitle: string;
    status?: string;
}

export default function PhaseManagement() {
    const [phases, setPhases] = useState<PhaseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted before showing dynamic content
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const loadPhases = async () => {
            try {
                const response = await fetch('/api/phases');
                
                if (response.ok) {
                    const data = await response.json();
                    setPhases(data || []);
                    setError('');
                } else {
                    setError(`API Error: ${response.status}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        loadPhases();
    }, [mounted]);

    // Always render the same initial content to avoid hydration mismatch
    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Phase Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-blue-50 rounded">
                        <div>⏳ Loading phases...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Phase Management</CardTitle>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="p-4 bg-blue-50 rounded">
                        <div>⏳ Loading phases...</div>
                        <div className="text-xs mt-1">Fetching from API...</div>
                    </div>
                )}

                {error && (
                    <Alert className="border-red-200 bg-red-50 mb-4">
                        <AlertDescription>❌ Error: {error}</AlertDescription>
                    </Alert>
                )}

                {!loading && !error && (
                    <div className="space-y-2">
                        <div className="p-4 bg-green-50 rounded">
                            ✅ Successfully loaded {phases.length} phases
                        </div>
                        
                        {phases.map((phase, index) => (
                            <div key={phase.id || index} className="p-3 border rounded">
                                <div className="font-medium">{phase.fullTitle}</div>
                                <div className="text-sm text-gray-600">
                                    ID: {phase.id} | Number: {phase.number} | Status: {phase.status || 'N/A'}
                                </div>
                            </div>
                        ))}
                        
                        {phases.length === 0 && (
                            <div className="p-4 bg-yellow-50 rounded">
                                ⚠️ No phases found
                            </div>
                        )}
                    </div>
                )}

                {/* Debug Section - Only show after mount */}
                <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
                    <div><strong>Debug Info:</strong></div>
                    <div>Loading: {loading.toString()}</div>
                    <div>Error: {error || 'none'}</div>
                    <div>Phases Count: {phases.length}</div>
                    <div>Mounted: {mounted.toString()}</div>
                    <div>Timestamp: {new Date().toLocaleTimeString()}</div>
                </div>
            </CardContent>
        </Card>
    );
} 