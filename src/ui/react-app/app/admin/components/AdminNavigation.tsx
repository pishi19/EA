import React from 'react';
import { Button } from '@/components/ui/button';
import { AdminView, AdminNavigationItem } from '../hooks/useAdminNavigation';

interface AdminNavigationProps {
    navigationItems: AdminNavigationItem[];
    activeView: AdminView;
    onNavigate: (view: AdminView) => void;
    className?: string;
}

export default function AdminNavigation({
    navigationItems,
    activeView,
    onNavigate,
    className = ""
}: AdminNavigationProps) {
    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            variant={activeView === item.id ? 'default' : 'ghost'}
                            className="flex items-center gap-2 whitespace-nowrap"
                            title={item.description}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{item.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
