import { useState, useEffect, useCallback } from 'react';
import { adminService, PhaseInfo, SystemStatus, AdminStats, AuditLogEntry, WorkstreamInfo } from '../services/adminService';

export interface UseAdminResult {
    // Data
    phases: PhaseInfo[];
    systemStatus: SystemStatus | null;
    adminStats: AdminStats | null;
    auditLogs: AuditLogEntry[];
    workstreams: WorkstreamInfo[];
    
    // Loading states
    loading: boolean;
    phasesLoading: boolean;
    statusLoading: boolean;
    statsLoading: boolean;
    auditLoading: boolean;
    workstreamsLoading: boolean;
    
    // Error states
    error: string | null;
    phasesError: string | null;
    statusError: string | null;
    statsError: string | null;
    auditError: string | null;
    workstreamsError: string | null;
    
    // Actions
    refreshPhases: () => Promise<void>;
    refreshSystemStatus: () => Promise<void>;
    refreshAdminStats: () => Promise<void>;
    refreshAuditLogs: () => Promise<void>;
    refreshWorkstreams: () => Promise<void>;
    refreshAll: () => Promise<void>;
    
    // Utilities
    formatDate: (dateString: string) => string;
    getStatusColor: (status: string) => string;
    getStatusBadgeVariant: (status: string) => 'default' | 'secondary' | 'destructive';
    isSystemHealthy: boolean;
}

export function useAdmin(): UseAdminResult {
    // State
    const [phases, setPhases] = useState<PhaseInfo[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [workstreams, setWorkstreams] = useState<WorkstreamInfo[]>([]);
    
    // Loading states
    const [phasesLoading, setPhasesLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [auditLoading, setAuditLoading] = useState(false);
    const [workstreamsLoading, setWorkstreamsLoading] = useState(false);
    
    // Error states
    const [phasesError, setPhasesError] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [auditError, setAuditError] = useState<string | null>(null);
    const [workstreamsError, setWorkstreamsError] = useState<string | null>(null);

    // Derived state
    const loading = phasesLoading || statusLoading || statsLoading || auditLoading || workstreamsLoading;
    const error = phasesError || statusError || statsError || auditError || workstreamsError;
    const isSystemHealthy = systemStatus?.overall === 'operational';

    // Refresh functions
    const refreshPhases = useCallback(async () => {
        try {
            setPhasesLoading(true);
            setPhasesError(null);
            const data = await adminService.getPhases();
            setPhases(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch phases';
            setPhasesError(errorMessage);
            console.error('useAdmin - refresh phases error:', error);
        } finally {
            setPhasesLoading(false);
        }
    }, []);

    const refreshSystemStatus = useCallback(async () => {
        try {
            setStatusLoading(true);
            setStatusError(null);
            const data = await adminService.getSystemStatus();
            setSystemStatus(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system status';
            setStatusError(errorMessage);
            console.error('useAdmin - refresh system status error:', error);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    const refreshAdminStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            setStatsError(null);
            const data = await adminService.getAdminStats();
            setAdminStats(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin stats';
            setStatsError(errorMessage);
            console.error('useAdmin - refresh admin stats error:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const refreshAuditLogs = useCallback(async () => {
        try {
            setAuditLoading(true);
            setAuditError(null);
            const data = await adminService.getAuditLogs(50, 0);
            setAuditLogs(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
            setAuditError(errorMessage);
            console.error('useAdmin - refresh audit logs error:', error);
        } finally {
            setAuditLoading(false);
        }
    }, []);

    const refreshWorkstreams = useCallback(async () => {
        try {
            setWorkstreamsLoading(true);
            setWorkstreamsError(null);
            const data = await adminService.getWorkstreams();
            setWorkstreams(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workstreams';
            setWorkstreamsError(errorMessage);
            console.error('useAdmin - refresh workstreams error:', error);
        } finally {
            setWorkstreamsLoading(false);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            refreshPhases(),
            refreshSystemStatus(),
            refreshAdminStats(),
            refreshAuditLogs(),
            refreshWorkstreams()
        ]);
    }, [refreshPhases, refreshSystemStatus, refreshAdminStats, refreshAuditLogs, refreshWorkstreams]);

    // Initial data load
    useEffect(() => {
        refreshAll();
    }, []);

    // Auto-refresh system status every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshSystemStatus();
        }, 30000);

        return () => clearInterval(interval);
    }, [refreshSystemStatus]);

    // Auto-refresh admin stats every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            refreshAdminStats();
        }, 300000);

        return () => clearInterval(interval);
    }, [refreshAdminStats]);

    return {
        // Data
        phases,
        systemStatus,
        adminStats,
        auditLogs,
        workstreams,
        
        // Loading states
        loading,
        phasesLoading,
        statusLoading,
        statsLoading,
        auditLoading,
        workstreamsLoading,
        
        // Error states
        error,
        phasesError,
        statusError,
        statsError,
        auditError,
        workstreamsError,
        
        // Actions
        refreshPhases,
        refreshSystemStatus,
        refreshAdminStats,
        refreshAuditLogs,
        refreshWorkstreams,
        refreshAll,
        
        // Utilities
        formatDate: adminService.formatDate,
        getStatusColor: adminService.getStatusColor,
        getStatusBadgeVariant: adminService.getStatusBadgeVariant,
        isSystemHealthy
    };
}
