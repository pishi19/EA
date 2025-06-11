import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { WorkstreamProvider } from '@/lib/workstream-context';

interface WorkstreamLayoutProps {
    children: React.ReactNode;
    params: {
        workstream: string;
    };
}

// Generate metadata based on workstream
export async function generateMetadata({ params }: { params: { workstream: string } }): Promise<Metadata> {
    const workstreamDisplayNames: Record<string, string> = {
        'ora': 'Ora System',
        'mecca': 'Mecca Project', 
        'sales': 'Sales & Marketing'
    };

    const displayName = workstreamDisplayNames[params.workstream] || params.workstream;
    
    return {
        title: `${displayName} | Multi-Workstream Platform`,
        description: `Workstream-specific interface for ${displayName}`
    };
}

export default function WorkstreamLayout({ children, params }: WorkstreamLayoutProps) {
    const { workstream } = params;

    return (
        <WorkstreamProvider defaultWorkstream={workstream}>
            <div className="min-h-screen bg-background">
                {/* Workstream Navigation Header */}
                <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            {/* Workstream Brand */}
                            <div className="flex items-center space-x-4">
                                <Link href={`/workstream/${workstream}`} className="text-xl font-bold">
                                    {workstream === 'ora' && '🤖 Ora System'}
                                    {workstream === 'mecca' && '🏛️ Mecca Project'}
                                    {workstream === 'sales' && '📈 Sales & Marketing'}
                                    {!['ora', 'mecca', 'sales'].includes(workstream) && `🚀 ${workstream}`}
                                </Link>
                                <span className="text-sm text-muted-foreground">
                                    Workstream: <code className="px-1 py-0.5 bg-muted rounded text-xs">{workstream}</code>
                                </span>
                            </div>

                            {/* Workstream Navigation */}
                            <nav className="flex items-center space-x-6">
                                <Link 
                                    href={`/workstream/${workstream}`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    href={`/workstream/${workstream}/planning`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Planning
                                </Link>
                                <Link 
                                    href={`/workstream/${workstream}/workstream-filter-demo`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Workstream
                                </Link>
                                <Link 
                                    href={`/workstream/${workstream}/semantic-chat-classic`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Chat
                                </Link>
                                <Link 
                                    href={`/workstream/${workstream}/admin`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Admin
                                </Link>
                            </nav>

                            {/* Workstream Switcher */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">Switch:</span>
                                <div className="flex space-x-1">
                                    <Link 
                                        href="/workstream/ora"
                                        className={`px-2 py-1 text-xs rounded ${workstream === 'ora' ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        Ora
                                    </Link>
                                    <Link 
                                        href="/workstream/mecca"
                                        className={`px-2 py-1 text-xs rounded ${workstream === 'mecca' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        Mecca
                                    </Link>
                                    <Link 
                                        href="/workstream/sales"
                                        className={`px-2 py-1 text-xs rounded ${workstream === 'sales' ? 'bg-purple-100 text-purple-800' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                    >
                                        Sales
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Workstream Content */}
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                </main>
            </div>
        </WorkstreamProvider>
    );
} 