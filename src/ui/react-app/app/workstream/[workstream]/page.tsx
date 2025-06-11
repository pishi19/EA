'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentWorkstream } from '@/lib/workstream-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WorkstreamDashboardProps {
    params: {
        workstream: string;
    };
}

export default function WorkstreamDashboard({ params }: WorkstreamDashboardProps) {
    const { workstream, config } = useCurrentWorkstream();

    const getWorkstreamColor = (ws: string) => {
        switch (ws) {
            case 'ora': return 'bg-blue-50 border-blue-200';
            case 'mecca': return 'bg-green-50 border-green-200';
            case 'sales': return 'bg-purple-50 border-purple-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Workstream Header */}
            <div className={`rounded-lg border p-6 ${getWorkstreamColor(workstream)}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{config?.displayName || workstream}</h1>
                        <p className="text-lg text-muted-foreground mt-2">{config?.description}</p>
                        <div className="flex items-center space-x-4 mt-4">
                            <Badge className={getStatusColor(config?.status || 'active')}>
                                {config?.status || 'active'}
                            </Badge>
                            {config?.owner && (
                                <span className="text-sm text-muted-foreground">
                                    Owner: <strong>{config.owner}</strong>
                                </span>
                            )}
                            {config?.created && (
                                <span className="text-sm text-muted-foreground">
                                    Created: {config.created}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-6xl">
                        {workstream === 'ora' && '🤖'}
                        {workstream === 'mecca' && '🏛️'}
                        {workstream === 'sales' && '📈'}
                        {!['ora', 'mecca', 'sales'].includes(workstream) && '🚀'}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">📋 Planning</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Task board and project planning
                        </p>
                        <Link href={`/workstream/${workstream}/planning`}>
                            <Button variant="outline" size="sm" className="w-full">
                                Open Planning
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">🎯 Workstream</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Hierarchical filtering and navigation
                        </p>
                        <Link href={`/workstream/${workstream}/workstream-filter-demo`}>
                            <Button variant="outline" size="sm" className="w-full">
                                View Artefacts
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">💬 Chat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Context-aware AI assistance
                        </p>
                        <Link href={`/workstream/${workstream}/semantic-chat-classic`}>
                            <Button variant="outline" size="sm" className="w-full">
                                Start Chat
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">⚙️ Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Workstream configuration
                        </p>
                        <Link href={`/workstream/${workstream}/admin`}>
                            <Button variant="outline" size="sm" className="w-full">
                                Admin Panel
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Workstream Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">📊 Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm">Total Artefacts:</span>
                            <Badge variant="secondary">Loading...</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Active Tasks:</span>
                            <Badge variant="secondary">Loading...</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Completed:</span>
                            <Badge variant="secondary">Loading...</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm">Last Updated:</span>
                            <Badge variant="secondary">Loading...</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">🗂️ Data Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                            <div className="font-mono text-xs bg-muted p-2 rounded">
                                /runtime/workstreams/{workstream}/
                                <br />├── roadmap.md
                                <br />├── artefacts/
                                <br />├── logs/
                                <br />└── config.yaml
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Isolated workstream data structure
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">🔄 Multi-Workstream</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="text-xs">
                                <span className="font-medium">Architecture:</span> Multi-tenant
                            </div>
                            <div className="text-xs">
                                <span className="font-medium">Isolation:</span> Complete
                            </div>
                            <div className="text-xs">
                                <span className="font-medium">URL Pattern:</span> /workstream/{workstream}/
                            </div>
                            <div className="text-xs">
                                <span className="font-medium">Context:</span> Workstream-aware
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Implementation Status */}
            <Card>
                <CardHeader>
                    <CardTitle>🚧 Multi-Workstream Implementation Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-green-700">✅ Completed</h4>
                            <ul className="text-sm space-y-1 text-green-600">
                                <li>• Workstream context provider</li>
                                <li>• URL routing structure (/workstream/[workstream]/)</li>
                                <li>• Workstream-specific layouts</li>
                                <li>• Navigation and breadcrumbs</li>
                                <li>• Multi-workstream dashboard</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-orange-700">🔄 In Progress</h4>
                            <ul className="text-sm space-y-1 text-orange-600">
                                <li>• Per-workstream data directories</li>
                                <li>• API workstream routing and scoping</li>
                                <li>• Dynamic workstream detection</li>
                                <li>• Multi-tenant isolation</li>
                                <li>• Comprehensive testing</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                            <strong>Current Focus:</strong> Project 12.9 - Multi-Workstream Architecture Transformation
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Transforming from single-tenant "Ora" system to scalable multi-workstream platform
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 