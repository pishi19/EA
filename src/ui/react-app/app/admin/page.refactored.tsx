"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Import existing admin components
import PhaseManagement from '@/components/admin/PhaseManagement';
import ArtefactBulkOperations from '@/components/admin/ArtefactBulkOperations';
import RoleManagement from '@/components/admin/RoleManagement';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import WorkstreamWizard from '@/components/admin/WorkstreamWizard';
import PhaseContextEditor from '@/components/PhaseContextEditor';

// Import new modular components
import AdminOverviewCards from './components/AdminOverviewCards';
import AdminNavigation from './components/AdminNavigation';
import SystemStatusView from './components/SystemStatusView';

// Import custom hooks
import { useAdmin } from './hooks/useAdmin';
import { useAdminNavigation } from './hooks/useAdminNavigation';

export default function AdminPage() {
    // Admin data and state management
    const {
        systemStatus,
        adminStats,
        loading,
        error,
        refreshSystemStatus,
        refreshAll,
        getStatusColor,
        getStatusBadgeVariant,
        isSystemHealthy
    } = useAdmin();

    // Navigation state management
    const {
        activeView,
        navigationItems,
        navigateTo
    } = useAdminNavigation('phases');

    // Error boundary component
    const ErrorBoundary = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
        <Card className="border-red-200 bg-red-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Admin System Error
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </Button>
            </CardContent>
        </Card>
    );

    // Render active view content
    const renderActiveView = () => {
        // Handle errors
        if (error && activeView !== 'status') {
            return <ErrorBoundary error={error} onRetry={refreshAll} />;
        }

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
                    <SystemStatusView
                        systemStatus={systemStatus}
                        loading={loading}
                        onRefresh={refreshSystemStatus}
                        getStatusColor={getStatusColor}
                        getStatusBadgeVariant={getStatusBadgeVariant}
                    />
                );
            default:
                return <PhaseManagement />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold">Ora System Administration</h1>
                    <div className="flex items-center gap-2">
                        {!isSystemHealthy && systemStatus && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                System Issues Detected
                            </div>
                        )}
                        <Button
                            onClick={refreshAll}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh All
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground">
                    Comprehensive admin interface for phases, projects, artefacts, workstreams, roles, and system configuration
                </p>
            </div>

            {/* Overview Cards */}
            <AdminOverviewCards
                systemStatus={systemStatus}
                adminStats={adminStats}
                loading={loading}
                getStatusColor={getStatusColor}
                getStatusBadgeVariant={getStatusBadgeVariant}
            />

            {/* Navigation */}
            <AdminNavigation
                navigationItems={navigationItems}
                activeView={activeView}
                onNavigate={navigateTo}
            />

            {/* Main Content Area */}
            <div className="mt-6">
                {renderActiveView()}
            </div>
        </div>
    );
}
