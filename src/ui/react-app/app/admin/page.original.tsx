"use client";

/**
 * @deprecated This is the original monolithic admin page component.
 * 
 * This file has been refactored into a modular architecture with:
 * - Service layer: services/adminService.ts
 * - Custom hooks: hooks/useAdmin.ts, hooks/useAdminNavigation.ts  
 * - Reusable components: components/AdminOverviewCards.tsx, components/AdminNavigation.tsx, etc.
 * - Main page: page.tsx (refactored version)
 * 
 * See REFACTORING_GUIDE.md for complete transformation details.
 * 
 * This file is kept for reference and rollback purposes.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, Database, FileText, Layers, Archive, Shield, Activity, Building } from 'lucide-react';
import PhaseManagement from '@/components/admin/PhaseManagement';
import ArtefactBulkOperations from '@/components/admin/ArtefactBulkOperations';
import RoleManagement from '@/components/admin/RoleManagement';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import WorkstreamWizard from '@/components/admin/WorkstreamWizard';
import PhaseContextEditor from '@/components/PhaseContextEditor';

type ActiveView = 'phases' | 'artefacts' | 'roles' | 'audit' | 'workstreams' | 'context' | 'status';

export default function AdminPage() {
    const [activeView, setActiveView] = useState<ActiveView>('phases');

    const renderActiveView = () => {
        switch (activeView) {
            case 'phases':
                return <PhaseManagement />;
            case 'artefacts':
                return <ArtefactBulkOperations />;
            case 'roles':
                return <RoleManagement />;
            case 'audit':
                return <AuditLogViewer />;
            case 'workstreams':
                return <WorkstreamWizard />;
            case 'context':
                return <PhaseContextEditor />;
            case 'status':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-900">✅ All Systems Operational</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        API endpoints, database connections, and core services are running normally.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <strong>API Status:</strong> Healthy
                                    </div>
                                    <div>
                                        <strong>Database:</strong> Connected
                                    </div>
                                    <div>
                                        <strong>Cache:</strong> Active
                                    </div>
                                    <div>
                                        <strong>Background Jobs:</strong> Running
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            default:
                return <PhaseManagement />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Ora System Administration</h1>
                <p className="text-muted-foreground">
                    Comprehensive admin interface for phases, projects, artefacts, workstreams, roles, and system configuration
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-2 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-sm">
                            <Settings className="w-4 h-4 mr-2" />
                            System Config
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-blue-600">Active</div>
                        <p className="text-xs text-muted-foreground">Core systems operational</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-2" />
                            User Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-green-600">Ready</div>
                        <p className="text-xs text-muted-foreground">Access control enabled</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-sm">
                            <Database className="w-4 h-4 mr-2" />
                            Data Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-orange-600">Healthy</div>
                        <p className="text-xs text-muted-foreground">All systems synced</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            CRUD Operations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-purple-600">Live</div>
                        <p className="text-xs text-muted-foreground">Full CRUD functionality</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                    <Button
                        onClick={() => setActiveView('phases')}
                        variant={activeView === 'phases' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Layers className="w-4 h-4" />
                        Phase Management
                    </Button>
                    <Button
                        onClick={() => setActiveView('artefacts')}
                        variant={activeView === 'artefacts' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        Artefact Operations
                    </Button>
                    <Button
                        onClick={() => setActiveView('workstreams')}
                        variant={activeView === 'workstreams' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Building className="w-4 h-4" />
                        Workstream Management
                    </Button>
                    <Button
                        onClick={() => setActiveView('roles')}
                        variant={activeView === 'roles' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Shield className="w-4 h-4" />
                        Role Management
                    </Button>
                    <Button
                        onClick={() => setActiveView('audit')}
                        variant={activeView === 'audit' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Activity className="w-4 h-4" />
                        Audit Logs
                    </Button>
                    <Button
                        onClick={() => setActiveView('context')}
                        variant={activeView === 'context' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Phase Context
                    </Button>
                    <Button
                        onClick={() => setActiveView('status')}
                        variant={activeView === 'status' ? 'default' : 'ghost'}
                        className="flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        System Status
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mt-6">
                {renderActiveView()}
            </div>
        </div>
    );
}
