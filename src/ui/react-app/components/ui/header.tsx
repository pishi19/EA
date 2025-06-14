"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function Header() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/ora', label: 'Ora', icon: Sparkles },
        { href: '/planning', label: 'Planning' },
        { href: '/workstream-filter-demo', label: 'Workstream' },
        // Removed: semantic-chat-classic - redundant with comprehensive workstream page
        // Archived: task-executor, system-view, phase-doc, contextual-chat-demo, system-docs
    ];

    return (
        <header className="bg-background border-b">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/" className="text-xl font-bold">Ora System</Link>
                <nav className="flex items-center space-x-6">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === link.href ? "" : "text-muted-foreground"
                            )}
                        >
                            <span className="flex items-center gap-1">
                                {link.icon && <link.icon className="w-4 h-4" />}
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
} 