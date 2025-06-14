import { useState, useCallback } from 'react';
import { Settings, Users, Database, FileText, Layers, Archive, Shield, Activity, Building } from 'lucide-react';

export type AdminView = 'phases' | 'artefacts' | 'roles' | 'audit' | 'workstreams' | 'context' | 'status';

export interface AdminNavigationItem {
    id: AdminView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

export interface UseAdminNavigationResult {
    // Current state
    activeView: AdminView;
    
    // Navigation items
    navigationItems: AdminNavigationItem[];
    
    // Actions
    setActiveView: (view: AdminView) => void;
    navigateTo: (view: AdminView) => void;
    getActiveItem: () => AdminNavigationItem | undefined;
    isActive: (view: AdminView) => boolean;
}

export function useAdminNavigation(initialView: AdminView = 'phases'): UseAdminNavigationResult {
    const [activeView, setActiveView] = useState<AdminView>(initialView);

    // Navigation configuration
    const navigationItems: AdminNavigationItem[] = [
        {
            id: 'phases',
            label: 'Phase Management',
            icon: Layers,
            description: 'Manage phases, projects, and system roadmap'
        },
        {
            id: 'artefacts',
            label: 'Artefact Operations',
            icon: Archive,
            description: 'Bulk operations, migration, and artefact management'
        },
        {
            id: 'workstreams',
            label: 'Workstream Management',
            icon: Building,
            description: 'Create and manage workstreams and contexts'
        },
        {
            id: 'roles',
            label: 'Role Management',
            icon: Shield,
            description: 'User roles, permissions, and access control'
        },
        {
            id: 'audit',
            label: 'Audit Logs',
            icon: Activity,
            description: 'System activity, changes, and audit trail'
        },
        {
            id: 'context',
            label: 'Phase Context',
            icon: FileText,
            description: 'Edit phase contexts and strategic information'
        },
        {
            id: 'status',
            label: 'System Status',
            icon: Settings,
            description: 'System health, performance, and diagnostics'
        }
    ];

    // Actions
    const navigateTo = useCallback((view: AdminView) => {
        setActiveView(view);
    }, []);

    const getActiveItem = useCallback(() => {
        return navigationItems.find(item => item.id === activeView);
    }, [activeView, navigationItems]);

    const isActive = useCallback((view: AdminView) => {
        return activeView === view;
    }, [activeView]);

    return {
        // Current state
        activeView,
        
        // Navigation items
        navigationItems,
        
        // Actions
        setActiveView,
        navigateTo,
        getActiveItem,
        isActive
    };
}
