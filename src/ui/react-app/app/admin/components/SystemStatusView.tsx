import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SystemStatus } from '../services/adminService';

interface SystemStatusViewProps {
    systemStatus: SystemStatus | null;
    loading: boolean;
    onRefresh: () => void;
    getStatusColor: (status: string) => string;
    getStatusBadgeVariant: (status: string) => 'default' | 'secondary' | 'destructive';
}

export default function SystemStatusView({
    systemStatus,
    loading,
    onRefresh,
    getStatusColor,
    getStatusBadgeVariant
}: SystemStatusViewProps) {
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'operational':
            case 'active':
            case 'connected':
            case 'running':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'degraded':
            case 'slow':
            case 'inactive':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'down':
            case 'error':
            case 'disconnected':
            case 'stopped':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <CheckCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getOverallStatusMessage = () => {
        if (!systemStatus) return 'System status unknown';
        
        switch (systemStatus.overall) {
            case 'operational':
                return 'All systems are running normally. No issues detected.';
            case 'degraded':
                return 'Some systems are experiencing issues. Performance may be affected.';
            case 'down':
                return 'Critical systems are down. Please check individual components.';
            default:
                return 'System status is being evaluated.';
        }
    };

    const getOverallStatusColor = () => {
        if (!systemStatus) return 'bg-gray-50';
        
        switch (systemStatus.overall) {
            case 'operational':
                return 'bg-green-50';
            case 'degraded':
                return 'bg-yellow-50';
            case 'down':
                return 'bg-red-50';
            default:
                return 'bg-gray-50';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-4 bg-gray-300 rounded"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    System Status
                    <Button 
                        onClick={onRefresh} 
                        variant="outline" 
                        size="sm"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`p-4 rounded-lg ${getOverallStatusColor()}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {systemStatus && getStatusIcon(systemStatus.overall)}
                            <h4 className={`font-medium ${systemStatus ? getStatusColor(systemStatus.overall) : 'text-gray-900'}`}>
                                {systemStatus ? `System ${systemStatus.overall.charAt(0).toUpperCase() + systemStatus.overall.slice(1)}` : 'Status Unknown'}
                            </h4>
                        </div>
                        <p className="text-sm text-gray-700">
                            {getOverallStatusMessage()}
                        </p>
                    </div>

                    {/* Component Status Grid */}
                    {systemStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h5 className="font-medium text-gray-900">Core Components</h5>
                                
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(systemStatus.api)}
                                        <div>
                                            <div className="font-medium">API Server</div>
                                            <div className="text-sm text-gray-600">REST API endpoints</div>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(systemStatus.api)}>
                                        {systemStatus.api.charAt(0).toUpperCase() + systemStatus.api.slice(1)}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(systemStatus.database)}
                                        <div>
                                            <div className="font-medium">Database</div>
                                            <div className="text-sm text-gray-600">Data persistence layer</div>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(systemStatus.database)}>
                                        {systemStatus.database.charAt(0).toUpperCase() + systemStatus.database.slice(1)}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="font-medium text-gray-900">Supporting Services</h5>
                                
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(systemStatus.cache)}
                                        <div>
                                            <div className="font-medium">Cache Layer</div>
                                            <div className="text-sm text-gray-600">Performance optimization</div>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(systemStatus.cache)}>
                                        {systemStatus.cache.charAt(0).toUpperCase() + systemStatus.cache.slice(1)}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(systemStatus.backgroundJobs)}
                                        <div>
                                            <div className="font-medium">Background Jobs</div>
                                            <div className="text-sm text-gray-600">Async processing</div>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(systemStatus.backgroundJobs)}>
                                        {systemStatus.backgroundJobs.charAt(0).toUpperCase() + systemStatus.backgroundJobs.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Information */}
                    <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-3">System Information</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Environment:</strong> Development
                            </div>
                            <div>
                                <strong>Version:</strong> v1.4.0
                            </div>
                            <div>
                                <strong>Last Updated:</strong> {new Date().toLocaleString()}
                            </div>
                            <div>
                                <strong>Uptime:</strong> Available
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
