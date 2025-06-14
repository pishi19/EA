import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Database, FileText } from 'lucide-react';
import { SystemStatus, AdminStats } from '../services/adminService';

interface AdminOverviewCardsProps {
    systemStatus: SystemStatus | null;
    adminStats: AdminStats | null;
    loading: boolean;
    getStatusColor: (status: string) => string;
    getStatusBadgeVariant: (status: string) => 'default' | 'secondary' | 'destructive';
}

export default function AdminOverviewCards({
    systemStatus,
    adminStats,
    loading,
    getStatusColor,
    getStatusBadgeVariant
}: AdminOverviewCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="border-2 border-gray-200 animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-full"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* System Configuration Card */}
            <Card className="border-2 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-sm">
                        <Settings className="w-4 h-4 mr-2" />
                        System Config
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className={`text-2xl font-bold ${systemStatus ? getStatusColor(systemStatus.overall) : 'text-gray-600'}`}>
                        {systemStatus ? systemStatus.overall.charAt(0).toUpperCase() + systemStatus.overall.slice(1) : 'Unknown'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {systemStatus ? 'Core systems operational' : 'Status checking...'}
                    </p>
                    {systemStatus && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant={getStatusBadgeVariant(systemStatus.api)} className="text-xs">
                                API: {systemStatus.api}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(systemStatus.database)} className="text-xs">
                                DB: {systemStatus.database}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Management Card */}
            <Card className="border-2 border-green-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        User Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-green-600">
                        {adminStats ? `${adminStats.users.active}/${adminStats.users.total}` : 'Loading...'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Active users / Total users
                    </p>
                    {adminStats && (
                        <div className="mt-2">
                            <Badge variant="default" className="text-xs">
                                {adminStats.users.active} Active
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Management Card */}
            <Card className="border-2 border-orange-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-sm">
                        <Database className="w-4 h-4 mr-2" />
                        Data Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-orange-600">
                        {adminStats ? `${adminStats.phases.total}` : 'Loading...'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Phases managed
                    </p>
                    {adminStats && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="default" className="text-xs">
                                {adminStats.phases.active} Active
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {adminStats.phases.completed} Done
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Workstream Operations Card */}
            <Card className="border-2 border-purple-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Workstream Operations
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-purple-600">
                        {adminStats ? `${adminStats.workstreams.active}/${adminStats.workstreams.total}` : 'Loading...'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Active workstreams
                    </p>
                    {adminStats && (
                        <div className="mt-2">
                            <Badge variant="default" className="text-xs">
                                {adminStats.workstreams.active} Live
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
