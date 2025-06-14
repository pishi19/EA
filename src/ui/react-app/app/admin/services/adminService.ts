// Admin service for system administration functionality
export interface PhaseInfo {
    id: string;
    number: string;
    title: string;
    fullTitle: string;
    status?: string;
}

export interface SystemStatus {
    api: 'healthy' | 'degraded' | 'down';
    database: 'connected' | 'disconnected' | 'slow';
    cache: 'active' | 'inactive' | 'error';
    backgroundJobs: 'running' | 'stopped' | 'error';
    overall: 'operational' | 'degraded' | 'down';
}

export interface AdminStats {
    phases: {
        total: number;
        active: number;
        completed: number;
    };
    artefacts: {
        total: number;
        recent: number;
    };
    workstreams: {
        total: number;
        active: number;
    };
    users: {
        total: number;
        active: number;
    };
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    details: string;
    workstream?: string;
}

export interface WorkstreamInfo {
    name: string;
    displayName: string;
    description: string;
    status: 'active' | 'inactive' | 'archived';
    created: string;
    lastModified: string;
}

class AdminService {
    private baseUrl = '/api';

    // Phase Management
    async getPhases(): Promise<PhaseInfo[]> {
        try {
            const response = await fetch(`${this.baseUrl}/phases`);
            if (!response.ok) {
                throw new Error(`Failed to fetch phases: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Admin service - fetch phases error:', error);
            throw error;
        }
    }

    async getPhaseContext(phase: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/phase-context?phase=${phase}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch phase context: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Admin service - fetch phase context error:', error);
            throw error;
        }
    }

    // Role Management
    async getRoles(): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/roles`, {
                headers: {
                    'x-workstream': 'ora'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Admin service - fetch roles error:', error);
            throw error;
        }
    }

    // Audit Logs
    async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogEntry[]> {
        try {
            const response = await fetch(`${this.baseUrl}/audit-logs?limit=${limit}&offset=${offset}`, {
                headers: {
                    'x-workstream': 'ora'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch audit logs: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Admin service - fetch audit logs error:', error);
            throw error;
        }
    }

    // System Status
    async getSystemStatus(): Promise<SystemStatus> {
        try {
            const healthCheck = await fetch(`${this.baseUrl}/phases`);
            
            const status: SystemStatus = {
                api: healthCheck.ok ? 'healthy' : 'degraded',
                database: 'connected',
                cache: 'active',
                backgroundJobs: 'running',
                overall: healthCheck.ok ? 'operational' : 'degraded'
            };
            
            return status;
        } catch (error) {
            console.error('Admin service - fetch system status error:', error);
            return {
                api: 'down',
                database: 'disconnected',
                cache: 'error',
                backgroundJobs: 'error',
                overall: 'down'
            };
        }
    }

    // Admin Statistics
    async getAdminStats(): Promise<AdminStats> {
        try {
            const [phases, roles] = await Promise.all([
                this.getPhases().catch(() => []),
                this.getRoles().catch(() => [])
            ]);

            return {
                phases: {
                    total: phases.length,
                    active: phases.filter(p => p.status !== 'completed').length,
                    completed: phases.filter(p => p.status === 'completed').length
                },
                artefacts: {
                    total: 0,
                    recent: 0
                },
                workstreams: {
                    total: 3,
                    active: 3
                },
                users: {
                    total: roles.length,
                    active: roles.filter((r: any) => r.status === 'active').length
                }
            };
        } catch (error) {
            console.error('Admin service - fetch admin stats error:', error);
            return {
                phases: { total: 0, active: 0, completed: 0 },
                artefacts: { total: 0, recent: 0 },
                workstreams: { total: 0, active: 0 },
                users: { total: 0, active: 0 }
            };
        }
    }

    // Workstream Management
    async getWorkstreams(): Promise<WorkstreamInfo[]> {
        try {
            return [
                {
                    name: 'ora',
                    displayName: 'Ora System',
                    description: 'Core autonomous agent capabilities and system architecture',
                    status: 'active',
                    created: '2024-01-01',
                    lastModified: new Date().toISOString()
                },
                {
                    name: 'mecca',
                    displayName: 'Mecca Business Development',
                    description: 'Business development and strategic partnerships',
                    status: 'active',
                    created: '2024-01-01',
                    lastModified: new Date().toISOString()
                },
                {
                    name: 'sales',
                    displayName: 'Sales Operations',
                    description: 'Customer acquisition and sales processes',
                    status: 'active',
                    created: '2024-01-01',
                    lastModified: new Date().toISOString()
                }
            ];
        } catch (error) {
            console.error('Admin service - fetch workstreams error:', error);
            throw error;
        }
    }

    // Health Check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/phases`);
            return response.ok;
        } catch (error) {
            console.error('Admin service - health check error:', error);
            return false;
        }
    }

    // Utility functions
    formatDate(dateString: string): string {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'operational':
            case 'active':
            case 'connected':
            case 'running':
                return 'text-green-600';
            case 'degraded':
            case 'slow':
            case 'inactive':
                return 'text-yellow-600';
            case 'down':
            case 'error':
            case 'disconnected':
            case 'stopped':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }

    getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'operational':
            case 'active':
            case 'connected':
            case 'running':
                return 'default';
            case 'degraded':
            case 'slow':
            case 'inactive':
                return 'secondary';
            case 'down':
            case 'error':
            case 'disconnected':
            case 'stopped':
                return 'destructive';
            default:
                return 'secondary';
        }
    }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService; 